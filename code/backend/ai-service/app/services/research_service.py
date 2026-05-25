from pathlib import Path
import threading
from typing import List
from google import genai
from google.genai import types

from app.core.config import get_settings
import requests
from bs4 import BeautifulSoup
import json
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

settings = get_settings()
gemini_client = genai.Client(api_key=settings["gemini_api_key"])

class ResearchService:
    def __init__(self):
        self.rag_enabled = settings.get("rag_enabled", False)
        self.vector_db = None
        self.Entrez = None
        self.Chroma = None
        
        if not self.rag_enabled:
            logger.info("RAG is disabled. ResearchService initialized in dummy mode.")
            return

        try:
            # Lazy imports for optional RAG dependencies
            from langchain_community.vectorstores import Chroma
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            from Bio import Entrez
            
            self.Entrez = Entrez
            self.Chroma = Chroma
            
            self.api_key = settings["gemini_api_key"]
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model=settings["gemini_embedding_model"],
                google_api_key=self.api_key
            )
            self.db_path = settings["chroma_db_path"]
            Path(self.db_path).mkdir(parents=True, exist_ok=True)
            
            self.vector_db = Chroma(
                persist_directory=self.db_path,
                embedding_function=self.embeddings
            )
            
            self.model_name = settings["gemini_model_name"]
            self.Entrez.email = settings.get("entrez_email", "admin@caretriage.com")
            logger.info("ResearchService: RAG features successfully initialized.")
        except Exception as e:
            logger.error(f"Error initializing optional RAG/Entrez dependencies: {e}. "
                         f"Falling back to disabled RAG mode.")
            self.rag_enabled = False
            self.vector_db = None
            self.Entrez = None

    def start_background_research(self, patient_id: int, query: str):
        """Start a background thread to research and cache medical info."""
        if not self.rag_enabled:
            logger.warning("Background research triggered but RAG is disabled. Skipping.")
            return
            
        thread = threading.Thread(target=self._perform_research, args=(patient_id, query))
        thread.start()
        logger.info(f"Background research started for patient {patient_id} with query: {query}")

    def _perform_research(self, patient_id: int, query: str):
        """Internal method to run research tasks."""
        if not self.rag_enabled or not self.vector_db:
            logger.warning("RAG is disabled or vector DB is uninitialized. Skipping research.")
            return

        try:
            # 1. Extract medical keywords using LLM
            entities = self._extract_entities(query)
            disease = entities.get("disease")
            if not disease:
                return

            logger.info(f"Researching for disease: {disease}")
            all_content = []

            # 2. Define specialized search queries
            search_queries = [
                f"{disease} nature lancet nejm",
                f"{disease} Overview",
                f"{disease} guidelines",
                f"{disease} Pathophysiology updated",
                f"{disease} cận lâm sàng liên quan",
                f"{disease} protocol"
            ]

            # 3. Perform PubMed Search (only if RAG Entrez is loaded)
            if self.Entrez:
                pubmed_results = self._search_pubmed(f"{disease} guidelines", max_results=5)
                all_content.extend(pubmed_results)

            # 4. Perform Web Search for each specialized query (guarded by ENABLE_WEB_RESEARCH)
            enable_web = settings.get("enable_web_research", False)
            tavily_key = settings.get("tavily_api_key")
            
            if enable_web and tavily_key:
                for q in search_queries:
                    web_results = self._search_web_tavily(q)
                    all_content.extend(web_results)
            else:
                logger.info("Web research is disabled or TAVILY_API_KEY is missing. Skipping Tavily searches.")

            # 5. Process and Store in Vector DB
            if all_content and self.vector_db:
                self.vector_db.add_texts(
                    texts=[item["content"] for item in all_content],
                    metadatas=[{"source": item["source"], "disease": disease, "patient_id": patient_id} for item in all_content]
                )
                logger.info(f"Successfully stored {len(all_content)} research chunks in Vector DB for {disease}")
                
        except Exception as e:
            logger.error(f"Error in background research: {str(e)}")

    def _search_web_tavily(self, query: str) -> List[dict]:
        """Search the web using Tavily API."""
        try:
            from tavily import TavilyClient
            tavily = TavilyClient(api_key=settings["tavily_api_key"])
            response = tavily.search(query=query, search_depth="advanced", max_results=3)
            
            results = []
            for res in response.get("results", []):
                results.append({
                    "content": f"Source: {res['url']}\nContent: {res['content']}",
                    "source": res['url']
                })
            return results
        except Exception as e:
            logger.error(f"Tavily search error for '{query}': {str(e)}")
            return []

    def _extract_entities(self, text: str) -> dict:
        if not hasattr(self, 'model_name') or not self.model_name:
            return {}
        prompt = f"Extract medical disease or primary symptom from this text. Return JSON with 'disease' key only. Text: {text}"
        response = gemini_client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        try:
            return json.loads(response.text.strip().removeprefix("```json").removesuffix("```").strip())
        except:
            return {}

    def _search_pubmed(self, query: str, max_results: int = 5) -> List[dict]:
        """Search PubMed for the given query."""
        if not self.Entrez:
            logger.warning("PubMed Entrez is not initialized.")
            return []
            
        logger.info(f"Searching PubMed for: {query}")
        try:
            handle = self.Entrez.esearch(db="pubmed", term=query, retmax=max_results)
            record = self.Entrez.read(handle)
            handle.close()
            
            ids = record["IdList"]
            results = []
            
            for pmid in ids:
                fetch_handle = self.Entrez.efetch(db="pubmed", id=pmid, retmode="xml")
                fetch_record = self.Entrez.read(fetch_handle)
                fetch_handle.close()
                
                try:
                    article = fetch_record["PubmedArticle"][0]["MedlineCitation"]["Article"]
                    title = article["ArticleTitle"]
                    abstract = "".join(article.get("Abstract", {}).get("AbstractText", ["No abstract available"]))
                    results.append({
                        "content": f"Title: {title}\nAbstract: {abstract}",
                        "source": f"PubMed ID: {pmid}"
                    })
                except:
                    continue
                    
            return results
        except Exception as e:
            logger.error(f"PubMed search error: {str(e)}")
            return []

    def get_context(self, query: str) -> str:
        """Retrieve relevant context for RAG."""
        if not self.rag_enabled or not self.vector_db:
            return ""
        try:
            results = self.vector_db.similarity_search(query, k=3)
            return "\n---\n".join([r.page_content for r in results])
        except Exception as e:
            logger.error(f"Error retrieving context from vector database: {e}")
            return ""
