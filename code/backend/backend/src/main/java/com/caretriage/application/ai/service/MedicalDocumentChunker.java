package com.caretriage.application.ai.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class MedicalDocumentChunker {

    private static final int DEFAULT_CHUNK_SIZE = 500;
    private static final int DEFAULT_OVERLAP_SIZE = 50;

    public record Chunk(String content, String section) {}

    public List<Chunk> chunkDocument(String text) {
        return chunkDocument(text, DEFAULT_CHUNK_SIZE, DEFAULT_OVERLAP_SIZE);
    }

    public List<Chunk> chunkDocument(String text, int maxChars, int overlap) {
        List<Chunk> chunks = new ArrayList<>();
        if (text == null || text.trim().isEmpty()) {
            return chunks;
        }

        String[] lines = text.split("\\r?\\n");
        StringBuilder currentHeader1 = new StringBuilder();
        StringBuilder currentHeader2 = new StringBuilder();
        StringBuilder currentHeader3 = new StringBuilder();
        StringBuilder sectionContent = new StringBuilder();

        Pattern headerPattern = Pattern.compile("^(#{1,3})\\s+(.+)$");

        for (String line : lines) {
            Matcher matcher = headerPattern.matcher(line.trim());
            if (matcher.matches()) {
                // If we have accumulated content, chunk it before moving to the new header
                if (sectionContent.length() > 0) {
                    String currentSection = getActiveSection(currentHeader1, currentHeader2, currentHeader3);
                    chunks.addAll(splitSectionText(sectionContent.toString(), currentSection, maxChars, overlap));
                    sectionContent.setLength(0);
                }

                int level = matcher.group(1).length();
                String title = matcher.group(2);

                if (level == 1) {
                    currentHeader1.setLength(0);
                    currentHeader1.append(title);
                    currentHeader2.setLength(0);
                    currentHeader3.setLength(0);
                } else if (level == 2) {
                    currentHeader2.setLength(0);
                    currentHeader2.append(title);
                    currentHeader3.setLength(0);
                } else {
                    currentHeader3.setLength(0);
                    currentHeader3.append(title);
                }
            } else {
                if (sectionContent.length() > 0) {
                    sectionContent.append("\n");
                }
                sectionContent.append(line);
            }
        }

        // Process any remaining content at the end of the file
        if (sectionContent.length() > 0) {
            String currentSection = getActiveSection(currentHeader1, currentHeader2, currentHeader3);
            chunks.addAll(splitSectionText(sectionContent.toString(), currentSection, maxChars, overlap));
        }

        return chunks;
    }

    private String getActiveSection(StringBuilder h1, StringBuilder h2, StringBuilder h3) {
        List<String> parts = new ArrayList<>();
        if (h1.length() > 0) parts.add(h1.toString());
        if (h2.length() > 0) parts.add(h2.toString());
        if (h3.length() > 0) parts.add(h3.toString());
        return parts.isEmpty() ? "General" : String.join(" > ", parts);
    }

    private List<Chunk> splitSectionText(String text, String section, int maxChars, int overlap) {
        List<Chunk> results = new ArrayList<>();
        if (text.trim().isEmpty()) {
            return results;
        }

        String headerPrefix = "";
        if (!"General".equals(section)) {
            headerPrefix = "[Section: " + section + "]\n";
        }
        int maxContentSize = maxChars - headerPrefix.length();
        if (maxContentSize <= 10) {
            headerPrefix = "";
            maxContentSize = maxChars;
        }

        List<String> rawChunks = splitRecursive(text, maxContentSize, overlap);
        for (String rc : rawChunks) {
            results.add(new Chunk(headerPrefix + rc, section));
        }
        return results;
    }

    private List<String> splitRecursive(String text, int maxChars, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (text.length() <= maxChars) {
            chunks.add(text);
            return chunks;
        }

        // Try splitting by paragraph
        String[] paragraphs = text.split("\\n\\n");
        if (paragraphs.length > 1) {
            StringBuilder currentChunk = new StringBuilder();
            for (String p : paragraphs) {
                if (currentChunk.length() + p.length() + 2 <= maxChars) {
                    if (currentChunk.length() > 0) {
                        currentChunk.append("\n\n");
                    }
                    currentChunk.append(p);
                } else {
                    if (currentChunk.length() > 0) {
                        chunks.add(currentChunk.toString());
                        currentChunk.setLength(0);
                    }
                    // If a single paragraph is too large, split it recursively by line
                    if (p.length() > maxChars) {
                        chunks.addAll(splitRecursive(p, maxChars, overlap));
                    } else {
                        currentChunk.append(p);
                    }
                }
            }
            if (currentChunk.length() > 0) {
                chunks.add(currentChunk.toString());
            }
            return mergeAndOverlap(chunks, maxChars, overlap);
        }

        // Split by lines
        String[] lines = text.split("\\n");
        if (lines.length > 1) {
            StringBuilder currentChunk = new StringBuilder();
            for (String l : lines) {
                if (currentChunk.length() + l.length() + 1 <= maxChars) {
                    if (currentChunk.length() > 0) {
                        currentChunk.append("\n");
                    }
                    currentChunk.append(l);
                } else {
                    if (currentChunk.length() > 0) {
                        chunks.add(currentChunk.toString());
                        currentChunk.setLength(0);
                    }
                    if (l.length() > maxChars) {
                        chunks.addAll(splitByWords(l, maxChars, overlap));
                    } else {
                        currentChunk.append(l);
                    }
                }
            }
            if (currentChunk.length() > 0) {
                chunks.add(currentChunk.toString());
            }
            return mergeAndOverlap(chunks, maxChars, overlap);
        }

        return splitByWords(text, maxChars, overlap);
    }

    private List<String> splitByWords(String text, int maxChars, int overlap) {
        List<String> chunks = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder currentChunk = new StringBuilder();

        for (String word : words) {
            if (currentChunk.length() + word.length() + 1 <= maxChars) {
                if (currentChunk.length() > 0) {
                    currentChunk.append(" ");
                }
                currentChunk.append(word);
            } else {
                if (currentChunk.length() > 0) {
                    chunks.add(currentChunk.toString());
                }
                // Backtrack for overlap
                currentChunk.setLength(0);
                if (overlap > 0 && chunks.size() > 0) {
                    String lastChunk = chunks.get(chunks.size() - 1);
                    int startIdx = Math.max(0, lastChunk.length() - overlap);
                    int spaceIdx = lastChunk.indexOf(' ', startIdx);
                    if (spaceIdx != -1) {
                        currentChunk.append(lastChunk.substring(spaceIdx + 1));
                        currentChunk.append(" ");
                    }
                }
                currentChunk.append(word);
            }
        }

        if (currentChunk.length() > 0) {
            chunks.add(currentChunk.toString());
        }

        return chunks;
    }

    private List<String> mergeAndOverlap(List<String> rawChunks, int maxChars, int overlap) {
        List<String> result = new ArrayList<>();
        if (rawChunks.isEmpty()) {
            return result;
        }

        for (int i = 0; i < rawChunks.size(); i++) {
            String current = rawChunks.get(i);
            if (i > 0 && overlap > 0) {
                String prev = rawChunks.get(i - 1);
                int overlapLength = Math.min(overlap, prev.length());
                String overlapPrefix = prev.substring(prev.length() - overlapLength);
                int spaceIdx = overlapPrefix.indexOf(' ');
                if (spaceIdx != -1) {
                    overlapPrefix = overlapPrefix.substring(spaceIdx + 1);
                }
                current = overlapPrefix + "\n" + current;
            }
            result.add(current);
        }
        return result;
    }
}
