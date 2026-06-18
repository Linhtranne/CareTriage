INSERT INTO external_doctor_sources 
(source_name, api_endpoint, base_url, allowed_domain, city, is_active) 
VALUES
('Medinet - Sở Y Tế TP.HCM', '/api/v1/crawl/medinet', 'https://medinet.hochiminhcity.gov.vn/danh-ba-bac-si', 'medinet.hochiminhcity.gov.vn', 'Hồ Chí Minh', true),
('Bộ Y Tế', '/api/v1/crawl/moh', 'https://moh.gov.vn', 'moh.gov.vn', 'Hà Nội', true),

('BookingCare', '/api/v1/crawl/bookingcare', 'https://bookingcare.vn/bac-si', 'bookingcare.vn', 'Hà Nội', true),
('YouMed', '/api/v1/crawl/youmed', 'https://youmed.vn/dat-kham', 'youmed.vn', 'Hồ Chí Minh', true),
('Bcare.vn', '/api/v1/crawl/bcare', 'https://bcare.vn/bac-si', 'bcare.vn', 'Hà Nội', true),
('Hello Bacsi', '/api/v1/crawl/hellobacsi', 'https://hellobacsi.com/bac-si', 'hellobacsi.com', 'Hồ Chí Minh', true),

('Bệnh viện Bạch Mai', '/api/v1/crawl/bachmai', 'http://bachmai.gov.vn', 'bachmai.gov.vn', 'Hà Nội', true),
('Bệnh viện Đại học Y Hà Nội', '/api/v1/crawl/hmuh', 'http://benhviendaihocyhanoi.com', 'benhviendaihocyhanoi.com', 'Hà Nội', true),
('Bệnh viện Việt Đức', '/api/v1/crawl/vietduc', 'http://benhvienvietduc.org', 'benhvienvietduc.org', 'Hà Nội', true),
('Bệnh viện Phụ sản Trung ương', '/api/v1/crawl/pstu', 'http://benhvienphusantrunguong.org.vn', 'benhvienphusantrunguong.org.vn', 'Hà Nội', true),
('Bệnh viện Chợ Rẫy', '/api/v1/crawl/choray', 'http://choray.vn', 'choray.vn', 'Hồ Chí Minh', true),
('Bệnh viện Nhi đồng 1', '/api/v1/crawl/nhidong1', 'http://nhidong.org.vn', 'nhidong.org.vn', 'Hồ Chí Minh', true),

('Hệ thống Y tế Thu Cúc TCI', '/api/v1/crawl/thucuc', 'https://benhvienthucuc.vn', 'benhvienthucuc.vn', 'Hà Nội', true),
('Bệnh viện ĐKQT Vinmec', '/api/v1/crawl/vinmec', 'https://vinmec.com', 'vinmec.com', 'Hà Nội', true),
('Bệnh viện Đa khoa Tâm Anh', '/api/v1/crawl/tamanh', 'https://tamanhhospital.vn/chuyen-gia', 'tamanhhospital.vn', 'Hà Nội', true);
