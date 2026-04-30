# CareTriage — Agile Scrum Templates

> Import các template này vào Jira / Trello / Notion / Linear

---

## 1. Task Board Columns

| Column | Mô tả | WIP Limit |
|--------|--------|-----------|
| **📋 To Do** | Task đã plan, chưa bắt đầu | Không giới hạn |
| **🔄 In Progress** | Đang thực hiện | Max 3 |
| **👀 In Review** | Code xong, đang review/test | Max 2 |
| **✅ Done** | Hoàn thành | Không giới hạn |

---

## 2. User Story Template

```
Title: [US-XXX] [Tên ngắn gọn]
As a [role], I want [action], so that [benefit].

Acceptance Criteria:
- [ ] Criteria 1
- [ ] Criteria 2

Story Points: [1/2/3/5/8]
Priority: [P0/P1/P2/P3]
Sprint: Sprint [N]
Epic: [Epic Name]
```

## 3. Task Template

```
Title: [T-XXX] [Tên task]
Type: Backend / Frontend / AI / DevOps
User Story: [US-XXX]
Points: [1/2/3/5/8]
Priority: [P0-P3]

Description: [Chi tiết]
Files affected: [list]
Dependencies: [T-XXX]

Definition of Done:
- [ ] Code implemented
- [ ] Self-tested
- [ ] No console errors
- [ ] Committed properly
```

## 4. Bug Report Template

```
Title: [BUG-XXX] [Mô tả]
Severity: Critical/High/Medium/Low
Steps to Reproduce:
1. Step 1
2. Step 2
Expected: [What should happen]
Actual: [What happens]
Screenshots: [Attach]
```

## 5. Git Branch Strategy

```
main → develop → feature/US-XXX-description
                → bugfix/BUG-XXX-description
                → hotfix/description
```

### Commit Convention
```
<type>(<scope>): <description>
Types: feat, fix, refactor, docs, style, test, chore, perf
Example: feat(auth): implement JWT login endpoint
```

## 6. Priority & Story Points

| Priority | Label | Description |
|----------|-------|-------------|
| P0 | 🔴 Critical | System broken |
| P1 | 🟠 High | Must complete this sprint |
| P2 | 🟡 Medium | Next sprint OK |
| P3 | 🟢 Low | Nice to have |

| Points | Time | Example |
|--------|------|---------|
| 1 | <30min | Fix typo |
| 2 | 30min-1hr | Simple component |
| 3 | 1-3hrs | Form with validation |
| 5 | 3-6hrs | WebSocket setup |
| 8 | 6-10hrs | AI integration |

## 7. Labels

| Label | Color | Usage |
|-------|-------|-------|
| `frontend` | 🔵 | React/UI |
| `backend` | 🟢 | Spring Boot |
| `ai-service` | 🟣 | Python/Gemini |
| `devops` | ⚫ | Docker/CI |
| `bug` | 🔴 | Bug reports |
