package com.caretriage.application.ai.port;

import java.io.InputStream;
import java.util.Map;

public interface DocumentIntelligence {
    Map<String, Object> extractEhrData(InputStream fileStream, String mimeType);
}
