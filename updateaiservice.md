• Dưới đây là plan và prompt chuẩn để biến ai-service thành AI Backend Service đúng nghĩa.
                                                                                                                                                                           
  Skill Đã Áp Dụng                                                                                                                                                         
                                                                                                                                                                           
  LLM Architect                                                                                                                                                            
  RAG Engineer                                                                                                                                                             
  Python Backend / FastAPI                                                                                                                                                 
  Structured Output                                                                                                                                                        
  LLM Security Audit                                                                                                                                                       
  Prompt Injection Defense                                                                                                                                                 
  AI Observability / Langfuse hướng mở rộng                                                                                                                                
  Vector Specialist hướng mở rộng
                                                                                                                                                                           
  Mục Tiêu                                                                                                                                                                 
  ai-service không được là nơi nhét prompt rồi gọi Gemini. Nó phải là một service backend AI có kiến trúc rõ:                                                              
                                                                                                                                                                           
  ai-service/                                                                                                                                                              
    app/                                                                                                                                                                   
      api/                  # FastAPI routers/controllers                                                                                                                  
      application/          # use cases / orchestration                                                                                                                    
      domain/               # business models, policies, domain rules                                                                                                      
      infrastructure/       # Gemini/OpenAI/vector DB/HTTP clients                                                                                                         
      shared/               # config, errors, logging, security                                                                                                            
      prompts/              # prompt registry/versioning                                                                                                                   
      evaluations/          # test cases, golden datasets, eval runners                                                                                                    
      main.py                                                                                                                                                              
    tests/                                                                                                                                                                 
    docs/                                                                                                                                                                  
    pyproject.toml                                                                                                                                                         
    Dockerfile                                                                                                                                                             
                                                                                                                                                                           
  Plan Hoàn Thiện AI Service                                                                                                                                               
  P0: Chuẩn hóa nền móng backend AI                                                                                                                                        
                                                                                                                                                                           
  - Tách routes.py, triage_service.py, ehr_extraction_service.py thành api/application/domain/infrastructure.                                                              
  - Tạo use cases: triage_use_case, ehr_extraction_use_case, medical_research_use_case, red_flag_screening_use_case.                                                       
  - Tạo provider abstraction: không gọi thẳng Gemini trong business logic.                                                                                                 
  - Tạo LLMProvider interface và implementation như GeminiProvider.                                                                                                        
  - Tạo PromptRegistry: prompt có tên, version, input schema, output schema, changelog.                                                                                    
  - Tạo DTO/Pydantic schema chặt cho request/response.                                                                                                                     
  - Loại prompt hardcode khỏi service logic.                                                                                                                               
  - Fix encoding/mojibake tiếng Việt.                                                                                                                                      
  - Tạo error model chuẩn: validation error, provider error, safety blocked, fallback response.                                                                            
                                                                                                                                                                           
  P1: Biến thành AI system đáng tin cậy                                                                                                                                    
                                                                                                                                                                           
  - Structured output bắt buộc cho triage/EHR, không parse raw text bằng regex nếu tránh được.                                                                             
  - Thêm validation/retry/fallback khi LLM trả sai schema.                                                                                                                 
  - Tách red flag detector thành domain policy chạy trước LLM.                                                                                                             
  - Tạo medical safety guardrails: emergency escalation, uncertainty handling, no diagnosis overclaim.                                                                     
  - Tạo prompt injection defense cho input người dùng và retrieved documents.                                                                                              
  - RAG phải có pipeline rõ: chunking, metadata, retrieval, rerank, context compression.                                                                                   
  - Không “stuff context”; chỉ đưa context đã lọc vào prompt.                                                                                                              
  - Thêm rate limit, timeout, request size limit, cost/token tracking.                                                                                                     
  - Thêm audit log không chứa PHI thô nếu không cần.                                                                                                                       
                                                                                                                                                                           
  P2: Production readiness                                                                                                                                                 
                                                                                                                                                                           
  - Observability: trace request, provider latency, token usage, schema failure rate, red-flag trigger rate.                                                               
  - Evaluation suite: golden test cases cho triage, EHR extraction, safety refusal, Vietnamese input.                                                                      
  - Regression tests cho prompt versions.                                                                                                                                  
  - Docker/CI command rõ: lint, type check, test.                                                                                                                          
  - API contract ổn định với Java backend.                                                                                                                                 
  - Có tài liệu docs/ai-service-architecture.md, docs/ai-service-api-contract.md, docs/ai-service-evaluation.md.                                                           
                                                                                                                                                                           
  Prompt Tổng Cho Agent Architect                                                                                                                                          
                                                                                                                                                                           
  Read and apply these Spawner Skills:                                                                                                                                     
                                                                                                                                                                           
  C:\Users\Hi\.spawner\skills\ai\llm-architect\skill.yaml                                                                                                                  
  C:\Users\Hi\.spawner\skills\ai-agents\rag-engineer\skill.yaml                                                                                                            
  C:\Users\Hi\.spawner\skills\backend\python-backend\skill.yaml                                                                                                            
  C:\Users\Hi\.spawner\skills\backend\structured-output\skill.yaml                                                                                                         
  C:\Users\Hi\.spawner\skills\security\llm-security-audit\skill.yaml                                                                                                       
  C:\Users\Hi\.spawner\skills\security\prompt-injection-defense\skill.yaml                                                                                                 
                                                                                                                                                                           
  Then audit this service:                                                                                                                                                 
                                                                                                                                                                           
  D:\CareTriage\code\backend\ai-service                                                                                                                                    
                                                                                                                                                                           
  Also read:                                                                                                                                                               
                                                                                                                                                                           
  D:\CareTriage\Structure.md                                                                                                                                               
  D:\CareTriage\.agent                                                                                                                                                     
  D:\CareTriage\.impeccable if relevant                                                                                                                                    
                                                                                                                                                                           
  Do not edit code yet.                                                                                                                                                    
                                                                                                                                                                           
  Goal:                                                                                                                                                                    
  Design a complete migration plan to transform ai-service from a prompt orchestration service into a production-grade AI backend service for a healthcare triage system.  
                                                                                                                                                                           
  Hard requirements:                                                                                                                                                       
  - Follow the project structure rules.                                                                                                                                    
  - Use clean architecture style: api/application/domain/infrastructure/shared.                                                                                            
  - Keep FastAPI.
  - Do not expose or print .env secrets.                                                                                                                                   
  - Treat this as healthcare software: safety, auditability, fallback behavior, explainability, and structured output are mandatory.                                       
  - LLM calls must go through provider abstraction.                                                                                                                        
  - Prompts must be versioned and tested.                                                                                                                                  
  - RAG must be retrieval-first, not context-stuffing.                                                                                                                     
  - Output must use Pydantic validation and retry/fallback.                                                                                                                
  - Include prompt injection defense.                                                                                                                                      
  - Include evaluation strategy.                                                                                                                                           
  - Do not touch frontend doctor/patient.                                                                                                                                  
  - Do not rewrite Java backend unless API contract changes are needed.                                                                                                    
                                                                                                                                                                           
  Deliverables:                                                                                                                                                            
  1. Current-state findings with severity.                                                                                                                                 
  2. Target ai-service folder tree.                                                                                                                                        
  3. Domain/application/infrastructure responsibilities.                                                                                                                   
  4. P0/P1/P2 migration plan.                                                                                                                                              
  5. API contract proposal with Java backend.                                                                                                                              
  6. Prompt registry/versioning design.                                                                                                                                    
  7. Structured output schema list.                                                                                                                                        
  8. RAG pipeline design.                                                                                                                                                  
  9. Safety and guardrail design.                                                                                                                                          
  10. Observability/evaluation/test strategy.                                                                                                                              
  11. Risks and open questions.                                                                                                                                            
                                                                                                                                                                           
  Prompt Cho Agent Worker Sau Khi Plan Được Duyệt                                                                                                                          
                                                                                                                                                                           
  You are implementing the approved ai-service migration plan.                                                                                                             
                                                                                                                                                                           
  Read first:                                                                                                                                                              
  D:\CareTriage\Structure.md                                                                                                                                               
  D:\CareTriage\.agent                                                                                                                                                     
  D:\CareTriage\docs\ai-service-architecture.md if it exists                                                                                                               
  D:\CareTriage\code\backend\ai-service                                                                                                                                    
                                                                                                                                                                           
  Apply these Spawner Skills:                                                                                                                                              
  C:\Users\Hi\.spawner\skills\backend\python-backend\skill.yaml                                                                                                            
  C:\Users\Hi\.spawner\skills\ai\llm-architect\skill.yaml                                                                                                                  
  C:\Users\Hi\.spawner\skills\backend\structured-output\skill.yaml                                                                                                         
  C:\Users\Hi\.spawner\skills\security\llm-security-audit\skill.yaml                                                                                                       
                                                                                                                                                                           
  Scope:                                                                                                                                                                   
  Only edit:                                                                                                                                                               
  D:\CareTriage\code\backend\ai-service\**                                                                                                                                 
                                                                                                                                                                           
  Do not edit:                                                                                                                                                             
  - frontend                                                                                                                                                               
  - admin-frontend                                                                                                                                                         
  - Java backend unless explicitly requested                                                                                                                               
  - .env files                                                                                                                                                             
                                                                                                                                                                           
  Implementation order:                                                                                                                                                    
  1. Create clean architecture folders.                                                                                                                                    
  2. Move existing route/service logic without changing behavior.                                                                                                          
  3. Introduce domain models and Pydantic schemas.                                                                                                                         
  4. Introduce LLMProvider interface and GeminiProvider implementation.                                                                                                    
  5. Move hardcoded prompts into prompt registry files.                                                                                                                    
  6. Add structured output validation and fallback errors.                                                                                                                 
  7. Add safety/red-flag policy layer.                                                                                                                                     
  8. Add tests for use cases and provider mocks.                                                                                                                           
  9. Update README/docs for how to run/test.                                                                                                                               
                                                                                                                                                                           
  Constraints:                                                                                                                                                             
  - Preserve existing API compatibility unless explicitly documented.                                                                                                      
  - Do not leak secrets.                                                                                                                                                   
  - Do not swallow exceptions silently.                                                                                                                                    
  - Avoid global mutable state.                                                                                                                                            
  - Avoid blocking sync calls inside async endpoints where possible.                                                                                                       
  - Use type hints.                                                                                                                                                        
  - Prefer small cohesive modules.                                                                                                                                         
  - Add tests for critical logic.                                                                                                                                          
                                                                                                                                                                           
  Final output:                                                                                                                                                            
  - Files changed.                                                                                                                                                         
  - Behavior preserved/changed.                                                                                                                                            
  - Tests run.                                                                                                                                                             
  - Remaining risks.                                                                                                                                                       
                                                                                                                                                                           
  Prompt Cho Agent Security/Eval Riêng                                                                                                                                     
                                                                                                                                                                           
  Audit D:\CareTriage\code\backend\ai-service as an LLM healthcare service.                                                                                                
                                                                                                                                                                           
  Apply:                                                                                                                                                                   
  C:\Users\Hi\.spawner\skills\security\llm-security-audit\skill.yaml                                                                                                       
  C:\Users\Hi\.spawner\skills\security\prompt-injection-defense\skill.yaml                                                                                                 
  C:\Users\Hi\.spawner\skills\ai-agents\agent-evaluation\skill.yaml                                                                                                        
                                                                                                                                                                           
  Do not edit code.                                                                                                                                                        
                                                                                                                                                                           
  Focus:                                                                                                                                                                   
  - Prompt injection                                                                                                                                                       
  - Indirect injection through RAG context                                                                                                                                 
  - PHI/PII leakage                                                                                                                                                        
  - Unsafe medical advice                                                                                                                                                  
  - Missing emergency escalation                                                                                                                                           
  - Overreliance on model output                                                                                                                                           
  - Schema validation failures                                                                                                                                             
  - Provider timeout/fallback gaps
  - Logging sensitive data                                                                                                                                                 
  - Missing eval cases                                                                                                                                                     
                                                                                                                                                                           
  Output:                                                                                                                                                                  
  1. Findings ordered by severity.                                                                                                                                         
  2. Reproduction examples.                                                                                                                                                
  3. Concrete mitigation.                                                                                                                                                  
  4. Required test cases.                                                                                                                                                  
  5. Go/no-go recommendation.                                                                                                                                              
                                                                                                                                                                           
  Hướng làm hợp lý nhất: chạy Architect Agent trước, mình review plan, rồi mới cho Worker sửa code. Nếu để Worker sửa ngay thì rất dễ chỉ “dọn folder” mà không giải quyết 
  bản chất: provider abstraction, prompt registry, structured output, safety, eval.    