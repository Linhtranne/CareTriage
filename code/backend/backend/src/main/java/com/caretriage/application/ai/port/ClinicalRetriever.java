package com.caretriage.application.ai.port;

import com.caretriage.application.ai.model.ClinicalEvidence;
import java.util.List;

public interface ClinicalRetriever {
    List<ClinicalEvidence> retrieveRelevantInfo(String patientSymptomText);
}
