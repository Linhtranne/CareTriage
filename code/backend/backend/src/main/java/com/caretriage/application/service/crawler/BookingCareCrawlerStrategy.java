package com.caretriage.application.service.crawler;

import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorSource;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
@Slf4j
@Component
@RequiredArgsConstructor
public class BookingCareCrawlerStrategy implements SourceCrawlerStrategy {

    private final ObjectMapper objectMapper;
    private static final String BASE_URL = "https://bookingcare.vn";
    private static final String PROPS_KEY = "props";
    private static final String PAGE_PROPS_KEY = "pageProps";
    private static final String DATA_KEY = "data";

    @Override
    public boolean supports(String domain) {
        return domain != null && domain.contains("bookingcare.vn");
    }

    @Override
    public List<ExternalDoctor> crawl(ExternalDoctorSource source) {
        log.info("Executing BookingCare SSR Crawler Strategy via __NEXT_DATA__");
        
        // Step 1: Get all specialties Map<SpecialtyUrl, SpecialtyName>
        Map<String, String> specialtyMap = getSpecialtyUrls();
        log.info("Found {} specialties.", specialtyMap.size());

        // Step 2: Get all doctor URLs. Map<DoctorUrl, SpecialtyName>
        Map<String, String> doctorMap = new ConcurrentHashMap<>();
        specialtyMap.entrySet().parallelStream().forEach(entry -> {
            try {
                Map<String, String> docsInSpec = getDoctorUrlsFromSpecialty(entry.getKey(), entry.getValue());
                doctorMap.putAll(docsInSpec);
            } catch (Exception e) {
                log.warn("Failed to extract doctors from specialty {}: {}", entry.getKey(), e.getMessage());
            }
        });
        
        log.info("Found {} unique doctor URLs across all specialties.", doctorMap.size());

        // Step 3: Fetch doctor details in parallel
        List<ExternalDoctor> doctors = doctorMap.entrySet().parallelStream()
                .map(entry -> fetchDoctorDetails(entry.getKey(), entry.getValue(), source))
                .filter(Objects::nonNull)
                .toList();

        log.info("Successfully extracted {} full doctor profiles.", doctors.size());
        
        return doctors;
    }

    private JsonNode fetchNextDataJson(String url) {
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout(15000)
                    .ignoreHttpErrors(true)
                    .sslSocketFactory(SslUtils.socketFactory())
                    .get();

            Element nextDataScript = doc.getElementById("__NEXT_DATA__");
            if (nextDataScript != null) {
                return objectMapper.readTree(nextDataScript.html());
            }
        } catch (Exception e) {
            log.warn("Failed to fetch next data from {}: {}", url, e.getMessage());
        }
        return null;
    }

    private JsonNode extractDataNode(JsonNode root) {
        if (root == null) return objectMapper.createObjectNode();
        return root.path(PROPS_KEY).path(PAGE_PROPS_KEY).path(DATA_KEY).path(DATA_KEY);
    }

    private Map<String, String> getSpecialtyUrls() {
        Map<String, String> map = new HashMap<>();
        JsonNode dataArray = extractDataNode(fetchNextDataJson(BASE_URL + "/dich-vu-y-te/kham-chuyen-khoa"));
        
        try {
            if (dataArray.isArray()) {
                for (JsonNode item : dataArray) {
                    String lk = item.path("lk").asText();
                    String ten = item.path("ten").asText("Đa khoa");
                    if (!lk.isEmpty() && !lk.equals("null")) {
                        map.put(lk.startsWith("http") ? lk : BASE_URL + lk, ten);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error parsing specialty URLs", e);
        }
        return map;
    }

    private Map<String, String> getDoctorUrlsFromSpecialty(String specialtyUrl, String specialtyName) {
        Map<String, String> map = new HashMap<>();
        JsonNode bsArray = extractDataNode(fetchNextDataJson(specialtyUrl)).path("bs");

        try {
            if (bsArray.isArray()) {
                for (JsonNode item : bsArray) {
                    addDoctorUrlIfValid(item, specialtyName, map);
                }
            }
        } catch (Exception e) {
            log.error("Error parsing doctor URLs from specialty", e);
        }
        return map;
    }

    private void addDoctorUrlIfValid(JsonNode item, String specialtyName, Map<String, String> map) {
        String lk = item.path("lk").asText();
        String name = item.path("ten").asText("");
        if (name.contains("Khám") || name.contains("Gói") || name.contains("Bệnh viện") || name.contains("Phòng khám")) {
            return;
        }
        if (!lk.isEmpty() && !lk.equals("null")) {
            map.put(lk.startsWith("http") ? lk : BASE_URL + lk, specialtyName);
        }
    }

    private ExternalDoctor fetchDoctorDetails(String doctorUrl, String specialtyName, ExternalDoctorSource source) {
        JsonNode docData = extractDataNode(fetchNextDataJson(doctorUrl));
        if (docData.isMissingNode() || docData.isEmpty()) return null;

        try {
            String name = resolveName(docData);
            if (name == null || name.isEmpty() || name.equals("null") || name.contains("Khám") || name.contains("Gói")) {
                return null;
            }

            String externalId = resolveExternalId(docData);
            String avatarUrl = resolveAvatarUrl(docData);
            String bio = resolveBio(docData);
            String clinicName = resolveClinicName(docData, source);
            String address = resolveAddress(docData);

            return ExternalDoctor.builder()
                    .source(source)
                    .externalId(externalId)
                    .fullName(name)
                    .specialization(specialtyName)
                    .hospitalName(clinicName)
                    .address(address)
                    .bio(bio)
                    .avatarUrl(avatarUrl)
                    .profileUrl(doctorUrl)
                    .verificationStatus(ExternalDoctor.VerificationStatus.UNVERIFIED)
                    .active(false)
                    .build();

        } catch (Exception e) {
            log.warn("Failed to extract details for doctor at {}: {}", doctorUrl, e.getMessage());
            return null;
        }
    }

    private String resolveName(JsonNode docData) {
        return docData.has("ten") ? docData.path("ten").asText() : docData.path("bacsi_ten").asText();
    }

    private String resolveExternalId(JsonNode docData) {
        if (docData.has("ma")) return docData.path("ma").asText();
        if (docData.has("code")) return docData.path("code").asText();
        return "BC-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String resolveAvatarUrl(JsonNode docData) {
        String avatarUrl = docData.path("anh").asText(null);
        if (avatarUrl != null && !avatarUrl.startsWith("http")) {
            avatarUrl = BASE_URL + avatarUrl;
        }
        return avatarUrl;
    }

    private String resolveBio(JsonNode docData) {
        String htmlBio = docData.path("noidung").asText("");
        if (!htmlBio.isEmpty() && !htmlBio.equals("null")) {
            return Jsoup.parse(htmlBio).text();
        }
        return "";
    }

    private String resolveClinicName(JsonNode docData, ExternalDoctorSource source) {
        String clinicName = extractClinicNameFromSchedule(docData);
        if (clinicName.equals("N/A") || clinicName.equals("null")) {
            clinicName = source.getSourceName();
        }
        return clinicName;
    }

    private String resolveAddress(JsonNode docData) {
        String address = extractAddressFromSchedule(docData);
        if (address.equals("null") || address.equals("N/A")) return null;
        return address;
    }

    private String extractClinicNameFromSchedule(JsonNode docData) {
        JsonNode lichkham = docData.path("lichkham");
        if (!lichkham.isObject() || lichkham.isEmpty()) return "N/A";
        for (Iterator<Map.Entry<String, JsonNode>> it = lichkham.fields(); it.hasNext(); ) {
            JsonNode buoi = it.next().getValue().path("buoi");
            if (buoi.isObject() && !buoi.isEmpty()) {
                for (Iterator<Map.Entry<String, JsonNode>> bit = buoi.fields(); bit.hasNext(); ) {
                    JsonNode noikham = bit.next().getValue().path("noikham");
                    if (noikham.isObject() && !noikham.isEmpty()) {
                        return noikham.path("ten").asText("N/A");
                    }
                }
            }
        }
        return "N/A";
    }

    private String extractAddressFromSchedule(JsonNode docData) {
        JsonNode lichkham = docData.path("lichkham");
        if (!lichkham.isObject() || lichkham.isEmpty()) return "N/A";
        for (Iterator<Map.Entry<String, JsonNode>> it = lichkham.fields(); it.hasNext(); ) {
            JsonNode buoi = it.next().getValue().path("buoi");
            if (buoi.isObject() && !buoi.isEmpty()) {
                for (Iterator<Map.Entry<String, JsonNode>> bit = buoi.fields(); bit.hasNext(); ) {
                    JsonNode noikham = bit.next().getValue().path("noikham");
                    if (noikham.isObject() && !noikham.isEmpty()) {
                        return noikham.path("diachi").asText("N/A");
                    }
                }
            }
        }
        return "N/A";
    }
}
