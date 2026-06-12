package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.PolicyResult;
import com.caretriage.application.ai.model.TriageResultDetail;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RedFlagDetector {

    private static final Set<String> NEGATION_TERMS = Set.of(
        "không",
        "không bị",
        "không có",
        "chưa từng",
        "chưa bị",
        "chưa có",
        "đâu có",
        "chả",
        "chẳng"
    );

    private static final Map<String, List<Pattern>> RED_FLAG_PATTERNS = new LinkedHashMap<>();
    private static final Map<String, List<Pattern>> NORMALIZED_RED_FLAG_PATTERNS = new LinkedHashMap<>();

    static {
        // STROKE
        RED_FLAG_PATTERNS.put("STROKE", List.of(
            Pattern.compile("đột quỵ"),
            Pattern.compile("méo miệng"),
            Pattern.compile("nói ngọng"),
            Pattern.compile("yếu\\s+(tay|chân|nửa người)"),
            Pattern.compile("liệt\\s+(tay|chân|nửa người)"),
            Pattern.compile("mất thị lực đột ngột"),
            Pattern.compile("đau đầu dữ dội đột ngột"),
            Pattern.compile("fast dương tính"),
            Pattern.compile("fast positive")
        ));

        // CHEST_PAIN
        RED_FLAG_PATTERNS.put("CHEST_PAIN", List.of(
            Pattern.compile("đau ngực dữ dội"),
            Pattern.compile("đau ngực lan\\s+(tay trái|hàm|lưng)"),
            Pattern.compile("tức ngực\\s+kèm\\s+(khó thở|vã mồ hôi|buồn nôn)"),
            Pattern.compile("tức ngực\\s+và\\s+(khó thở|vã mồ hôi|buồn nôn)"),
            Pattern.compile("nghi nhồi máu cơ tim"),
            Pattern.compile("nhồi máu cơ tim")
        ));

        // DYSPNEA
        RED_FLAG_PATTERNS.put("DYSPNEA", List.of(
            Pattern.compile("khó thở nặng"),
            Pattern.compile("tím tái"),
            Pattern.compile("không thở được"),
            Pattern.compile("thở rít"),
            Pattern.compile("thở khò khè"),
            Pattern.compile("spo2\\s+(dưới|<)\\s*(9[0-4]|8[0-9])")
        ));

        // SEIZURE
        RED_FLAG_PATTERNS.put("SEIZURE", List.of(
            Pattern.compile("co giật"),
            Pattern.compile("mất ý thức"),
            Pattern.compile("lú lẫn đột ngột"),
            Pattern.compile("hôn mê")
        ));

        // TRAUMA
        RED_FLAG_PATTERNS.put("TRAUMA", List.of(
            Pattern.compile("chảy máu không cầm"),
            Pattern.compile("tai nạn nghiêm trọng"),
            Pattern.compile("chấn thương đầu"),
            Pattern.compile("gãy xương hở")
        ));

        // ANAPHYLAXIS
        RED_FLAG_PATTERNS.put("ANAPHYLAXIS", List.of(
            Pattern.compile("khó thở sau ăn"),
            Pattern.compile("khó thở sau uống thuốc"),
            Pattern.compile("khó thở sau ong đốt"),
            Pattern.compile("sưng\\s+(môi|lưỡi|họng)"),
            Pattern.compile("mề đay\\s+kèm\\s+khó thở"),
            Pattern.compile("mề đay\\s+và\\s+khó thở")
        ));

        // PREGNANCY
        RED_FLAG_PATTERNS.put("PREGNANCY", List.of(
            Pattern.compile("có thai\\s+ra máu nhiều"),
            Pattern.compile("mang thai\\s+ra máu nhiều"),
            Pattern.compile("đau bụng dữ dội khi mang thai"),
            Pattern.compile("đau bụng dữ dội khi có thai"),
            Pattern.compile("đau đầu dữ dội\\s+phù\\s+nhìn mờ")
        ));

        // MENTAL_HEALTH
        RED_FLAG_PATTERNS.put("MENTAL_HEALTH", List.of(
            Pattern.compile("muốn tự tử"),
            Pattern.compile("muốn tự sát"),
            Pattern.compile("ý định tự tử"),
            Pattern.compile("tự làm hại bản thân"),
            Pattern.compile("muốn làm hại người khác")
        ));

        // PEDIATRIC
        RED_FLAG_PATTERNS.put("PEDIATRIC", List.of(
            Pattern.compile("bỏ bú"),
            Pattern.compile("li bì"),
            Pattern.compile("sốt cao\\s+co giật"),
            Pattern.compile("rút lõm lồng ngực")
        ));

        // NORMALIZED PATTERNS
        NORMALIZED_RED_FLAG_PATTERNS.put("CHEST_PAIN", List.of(
            Pattern.compile("dau\\s+(tuc\\s+)?nguc\\s+(du\\s+doi\\s+)?lan\\s+(ra\\s+)?(canh\\s+)?tay\\s+trai"),
            Pattern.compile("dau\\s+(tuc\\s+)?nguc.*kho\\s+tho.*(toat|va)\\s+mo\\s+hoi")
        ));

        NORMALIZED_RED_FLAG_PATTERNS.put("STROKE", List.of(
            Pattern.compile("meo\\s+mieng.*(liet|yeu)\\s+nua\\s+nguoi"),
            Pattern.compile("dot\\s+ngot.*(meo\\s+mieng|liet|yeu)")
        ));
    }

    public static String normalizeVietnameseText(String text) {
        if (text == null) {
            return "";
        }
        String lower = text.toLowerCase()
                .replace("đ", "d")
                .replace("Đ", "d");
        String normalized = Normalizer.normalize(lower, Normalizer.Form.NFKD);
        return normalized.replaceAll("\\p{M}", "");
    }

    public static boolean isNegated(String segment, int matchStart) {
        String precedingText = segment.substring(0, matchStart).trim();
        if (precedingText.isEmpty()) {
            return false;
        }

        List<String> words = new ArrayList<>();
        // Use Unicode character class (?U) to match Vietnamese diacritics
        Matcher m = Pattern.compile("(?U)\\w+").matcher(precedingText);
        while (m.find()) {
            words.add(m.group().toLowerCase());
        }

        if (words.isEmpty()) {
            return false;
        }

        for (String word : words) {
            if (NEGATION_TERMS.contains(word)) {
                return true;
            }
        }

        for (int i = 0; i < words.size() - 1; i++) {
            String twoWord = words.get(i) + " " + words.get(i + 1);
            if (NEGATION_TERMS.contains(twoWord)) {
                return true;
            }
        }

        return false;
    }

    public static PolicyResult detectRedFlags(String text) {
        if (text == null || text.trim().isEmpty()) {
            return null;
        }

        // Split by punctuation and contrastive conjunctions, using (?U) for unicode boundary
        String cleanedText = text.toLowerCase();
        String[] clauses = cleanedText.split("(?U)[,.;!?]|\\bbut\\b|\\bnhưng\\b|\\bsong\\b|\\btuy nhiên\\b");

        List<MatchedCategory> matchedCategories = new ArrayList<>();

        for (String clause : clauses) {
            clause = clause.strip();
            if (clause.isEmpty()) {
                continue;
            }

            for (Map.Entry<String, List<Pattern>> entry : RED_FLAG_PATTERNS.entrySet()) {
                String category = entry.getKey();
                for (Pattern pattern : entry.getValue()) {
                    Matcher matcher = pattern.matcher(clause);
                    while (matcher.find()) {
                        int start = matcher.start();
                        if (!isNegated(clause, start)) {
                            matchedCategories.add(new MatchedCategory(category, matcher.group(0)));
                            break; // break the match loop for this pattern
                        }
                    }
                }
            }
        }

        if (matchedCategories.isEmpty()) {
            String normalizedText = normalizeVietnameseText(text);
            for (Map.Entry<String, List<Pattern>> entry : NORMALIZED_RED_FLAG_PATTERNS.entrySet()) {
                String category = entry.getKey();
                for (Pattern pattern : entry.getValue()) {
                    Matcher normMatcher = pattern.matcher(normalizedText);
                    if (normMatcher.find()) {
                        matchedCategories.add(new MatchedCategory(category, normMatcher.group(0)));
                        break; // matches first matched pattern for category
                    }
                }
                if (!matchedCategories.isEmpty()) {
                    break; // stop scanning categories if one is matched
                }
            }
        }

        if (matchedCategories.isEmpty()) {
            return null;
        }

        MatchedCategory primary = matchedCategories.get(0);
        String primaryCategory = primary.category;
        String matchedSymptom = primary.symptom;

        String replyMsg = "Các dấu hiệu bạn mô tả (bao gồm triệu chứng có nguy cơ đe dọa sức khỏe: "
                + "'" + matchedSymptom + "') có thể liên quan đến tình trạng cấp cứu nguy kịch. "
                + "Vui lòng gọi 115 hoặc di chuyển đến khoa Cấp cứu gần nhất ngay lập tức. "
                + "Tuyệt đối không tự lái xe.";

        TriageResultDetail detail = TriageResultDetail.builder()
                .categoryName("Cấp cứu")
                .suggestedDepartmentCode("EMERGENCY")
                .suggestedDepartmentName("Cấp cứu")
                .urgencyLevel("EMERGENCY")
                .possibleConditions(List.of("Nghi ngờ tình trạng khẩn cấp thuộc nhóm " + primaryCategory))
                .suggestedActions(List.of("Gọi 115 ngay lập tức", "Di chuyển đến khoa Cấp cứu gần nhất"))
                .confidenceScore(1.0)
                .summary("Phát hiện triệu chứng cấp cứu thuộc nhóm " + primaryCategory + " (" + matchedSymptom + ") qua bộ lọc cờ đỏ.")
                .redFlagDetected(true)
                .departmentMappingStatus("RED_FLAG_BYPASS")
                .build();

        return PolicyResult.builder()
                .isTriggered(true)
                .replyMsg(replyMsg)
                .triageResult(detail)
                .build();
    }

    private static class MatchedCategory {
        final String category;
        final String symptom;

        MatchedCategory(String category, String symptom) {
            this.category = category;
            this.symptom = symptom;
        }
    }
}
