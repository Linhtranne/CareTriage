from collections import defaultdict
from typing import Dict, List, Set, Tuple

from app.domain.interfaces import IClinicalContextBuilder
from app.domain.schemas import (
    ClinicalConflict,
    ClinicalContext,
    ClinicalContextInput,
    ClinicalFact,
    DomainHistoryMessage,
    RagDocument,
)


class DeterministicClinicalContextBuilder(IClinicalContextBuilder):
    MAX_HISTORY_ENTRIES = 30
    MAX_HISTORY_CHARS = 12_000
    MAX_FACT_CHARS = 3_000
    MAX_RETRIEVAL_CHARS = 6_000
    MAX_TOTAL_CONTEXT_CHARS = 20_000

    REQUIRED_FACT_TYPES = {"symptom", "onset", "severity"}

    PRECEDENCE = {
        "PATIENT": 4,
        "PROFILE": 3,
        "ATTACHMENT": 2,
        "RETRIEVAL": 1,
    }

    def build(self, context_input: ClinicalContextInput) -> ClinicalContext:
        prompt_history = self._process_history(context_input.conversation_history)
        known_facts, conflicts, missing_fact_types = self._process_facts(context_input)
        context_text = self._build_context_text(
            known_facts, context_input.retrieved_evidence
        )

        return ClinicalContext(
            prompt_history=prompt_history,
            current_message=context_input.current_message,
            known_facts=known_facts,
            missing_fact_types=missing_fact_types,
            conflicts=conflicts,
            context_text=context_text,
        )

    def _process_history(self, history: List[DomainHistoryMessage]) -> List[str]:
        history_to_process = history[-self.MAX_HISTORY_ENTRIES :]
        history_char_count = 0
        processed_history = []
        for msg in reversed(history_to_process):
            role = "Patient" if msg.role == "user" else "Assistant"
            line = f"{role}: {msg.content}"
            if history_char_count + len(line) <= self.MAX_HISTORY_CHARS:
                processed_history.append(line)
                history_char_count += len(line)
            else:
                remaining = self.MAX_HISTORY_CHARS - history_char_count
                if remaining > 10:
                    truncated_content = (
                        msg.content[: remaining - len(role) - 15] + "... (truncated)"
                    )
                    truncated_line = f"{role}: {truncated_content}"
                    processed_history.append(truncated_line)
                break
        return list(reversed(processed_history))

    def _process_facts(
        self, context_input: ClinicalContextInput
    ) -> Tuple[List[ClinicalFact], List[ClinicalConflict], List[str]]:
        all_facts: List[ClinicalFact] = []
        all_facts.extend(context_input.patient_facts)
        all_facts.extend(context_input.attachment_facts)

        known_facts: List[ClinicalFact] = []
        conflicts: List[ClinicalConflict] = []
        facts_by_type: Dict[str, List[ClinicalFact]] = defaultdict(list)

        for fact in all_facts:
            facts_by_type[fact.fact_type].append(fact)
            known_facts.append(fact)

        provided_fact_types: Set[str] = set()
        for f_type, facts in facts_by_type.items():
            provided_fact_types.add(f_type)
            unique_values = {f.value.lower().strip() for f in facts}
            if len(unique_values) > 1:
                conflict = ClinicalConflict(
                    fact_type=f_type,
                    fact_ids=[f.fact_id for f in facts],
                    description=f"Conflicting values found for {f_type}: {', '.join(f.value for f in facts)}",
                )
                conflicts.append(conflict)

        missing_fact_types = sorted(self.REQUIRED_FACT_TYPES - provided_fact_types)
        return known_facts, conflicts, missing_fact_types

    def _build_context_text(
        self, known_facts: List[ClinicalFact], retrieved_evidence: List[RagDocument]
    ) -> str:
        context_text_parts = []
        fact_text_lines = []
        for fact in sorted(
            known_facts,
            key=lambda x: self.PRECEDENCE.get(x.source, 0),
            reverse=True,
        ):
            line = f"[{fact.source}] {fact.fact_type}: {fact.value} (conf: {fact.confidence:.2f})"
            fact_text_lines.append(line)

        fact_text = "\n".join(fact_text_lines)
        if len(fact_text) > self.MAX_FACT_CHARS:
            fact_text = fact_text[: self.MAX_FACT_CHARS - 15] + "... (truncated)"

        if fact_text:
            context_text_parts.append(f"KNOWN FACTS:\n{fact_text}")

        retrieval_lines = []
        for doc in retrieved_evidence:
            retrieval_lines.append(f"[{doc.source}] {doc.content}")

        retrieval_text = "\n\n".join(retrieval_lines)
        if len(retrieval_text) > self.MAX_RETRIEVAL_CHARS:
            retrieval_text = (
                retrieval_text[: self.MAX_RETRIEVAL_CHARS - 15] + "... (truncated)"
            )

        if retrieval_text:
            context_text_parts.append(f"RETRIEVED EVIDENCE:\n{retrieval_text}")

        context_text = "\n\n".join(context_text_parts)
        if len(context_text) > self.MAX_TOTAL_CONTEXT_CHARS:
            context_text = context_text[: self.MAX_TOTAL_CONTEXT_CHARS]

        return context_text
