import os
from dotenv import load_dotenv
import threading
from typing import List
import google.generativeai as genai

# Load environment variables
load_dotenv(override=True)
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from Bio import Entrez
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

# Bio Entrez config (required for PubMed)
Entrez.email = os.getenv("ENTREZ_EMAIL", "admin@caretriage.com")

class ResearchService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=self.api_key
        )
        self.db_path = os.path.join(os.getcwd(), "data", "vector_db")
        os.makedirs(self.db_path, exist_ok=True)
        
        self.vector_db = Chroma(
            persist_directory=self.db_path,
            embedding_function=self.embeddings
        )
        
        self.model = genai.GenerativeModel(os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-pro"))

    def start_background_research(self, patient_id: int, query: str):
        """Start a background thread to research and cache medical info."""
        thread = threading.Thread(target=self._perform_research, args=(patient_id, query))
        thread.start()
        logger.info(f"Background research started for patient {patient_id} with query: {query}")

    def _perform_research(self, patient_id: int, query: str):
        """Internal method to run research tasks."""
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

            # 3. Perform PubMed Search (for guidelines and peer-reviewed stuff)
            pubmed_results = self._search_pubmed(f"{disease} guidelines", max_results=5)
            all_content.extend(pubmed_results)

            # 4. Perform Web Search for each specialized query
            # We use Tavily if API key is present, otherwise fallback to mock/limited search
            tavily_key = os.getenv("TAVILY_API_KEY")
            if tavily_key:
                for q in search_queries:
                    web_results = self._search_web_tavily(q)
                    all_content.extend(web_results)
            else:
                logger.warning("TAVILY_API_KEY not found. Skipping specialized web searches.")

            # 5. Process and Store in Vector DB
            if all_content:
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
            tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
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
        prompt = f"Extract medical disease or primary symptom from this text. Return JSON with 'disease' key only. Text: {text}"
        response = self.model.generate_content(prompt)
        try:
            return json.loads(response.text.strip().removeprefix("```json").removesuffix("```").strip())
        except:
            return {}

    def _search_pubmed(self, query: str, max_results: int = 5) -> List[dict]:
        """Search PubMed for the given query."""
        logger.info(f"Searching PubMed for: {query}")
        try:
            handle = Entrez.esearch(db="pubmed", term=query, retmax=max_results)
            record = Entrez.read(handle)
            handle.close()
            
            ids = record["IdList"]
            results = []
            
            for pmid in ids:
                fetch_handle = Entrez.efetch(db="pubmed", id=pmid, retmode="xml")
                fetch_record = Entrez.read(fetch_handle)
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
        results = self.vector_db.similarity_search(query, k=3)
        return "\n---\n".join([r.page_content for r in results])
