# CareTriage - Project Intelligence

This file contains critical project conventions and commands for Claude Code.

## 🤖 Specialist Agents
You have access to 70+ specialized agents in `.claude/agents/`. Call them with `/agent <name>`.
- **System Rules**: `/agent system-rules` (Mandatory for global constraints)
- **Architecture**: `/agent project-architect` (High-level system design)
- **Specialists**: `frontend-specialist`, `backend-specialist`, `database-architect`, etc.

## 🛠 Commands
### Root Commands
- Install SDK: `npm install @anthropic-ai/claude-agent-sdk`

### Frontend (React + Vite)
- Dev: `npm run dev --prefix frontend`
- Build: `npm run build --prefix frontend`
- Lint: `npm run lint --prefix frontend`
- Preview: `npm run preview --prefix frontend`

### Backend (Java + Spring Boot)
- Run: `mvn spring-boot:run -f backend/pom.xml`
- Build: `mvn clean install -f backend/pom.xml`
- Test: `mvn test -f backend/pom.xml`

## 📏 Core Rules
1. **Agent Routing Checklist**: Before any code or design work, you MUST identify the correct specialist agent and announce it: `🤖 Applying knowledge of @[agent-name]...`.
2. **Socratic Gate**: For complex requests, STOP and ASK at least 3 strategic questions before implementation.
3. **Clean Code**: Follow `@clean-code` standards: concise, direct, no over-engineering.
4. **Language**: Respond in the user's language (Vietnamese), but keep code comments and variables in English.
5. **Path Awareness**: Always check `ARCHITECTURE.md` before making structural changes.

## 🏗 Technology Stack
- **Frontend**: React 19, Vite, Tailwind CSS v4, MUI v9, Framer Motion, Zustand.
- **Backend**: Java 21, Spring Boot, Maven, JPA/Hibernate.
- **AI**: Integration with Anthropic Claude and Google Gemini.

---
> [!IMPORTANT]
> This project follows a strict **Modular Skill Loading Protocol**. Always refer to the specialist agents in `.claude/agents/` for domain-specific instructions.
