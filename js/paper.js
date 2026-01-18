/**
 * ExamArchive v2 — Paper Page (RESTORED & ALIGNED)
 * Works with existing paper.html layout
 */

const PAPERS_URL = "./data/papers.json";
const SYLLABUS_BASE = "./data/syllabus/";
const RQ_BASE = "./data/repeated-questions/";

const params = new URLSearchParams(window.location.search);
const SHORT_CODE = params.get("code");

if (!SHORT_CODE) {
  document.querySelector(".paper-page").innerHTML =
    "<p class='coming-soon'>Invalid paper link.</p>";
  throw new Error("Missing paper code");
}

// ----------- Overrides for signed URLs -----------
const PDF_OVERRIDES = {
  "au_cbcs_phsdse501t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phsdse501t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNkc2U1MDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDkxLCJleHAiOjE3NjkzNDI4OTF9.0pRomOxsrI90yMtSJizsEcr-H7NnXZ4t70_5DnW54-E",
  "au_cbcs_phsdse501t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phsdse501t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNkc2U1MDF0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDkxLCJleHAiOjE3NjkzNDI4OTF9.eS8bYTys57EJmlljLKBExI5xCHAs1wspMWYvhr5LXZA",
  "au_cbcs_phsdse502t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phsdse502t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNkc2U1MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDkxLCJleHAiOjE3NjkzNDI4OTF9.fB-JdJrFkxqWSZAgZWYe5ppgpikCygob-grSO6Ns-EQ",
  "au_cbcs_phsdse502t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phsdse502t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNkc2U1MDJ0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDkyLCJleHAiOjE3NjkzNDI4OTJ9.cVlTHmhXdgKhZF_RdSG_iUgCNopQUAAdQbZFy4TwIpk",
  "au_cbcs_phsdse601t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phsdse601t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNkc2U2MDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDkyLCJleHAiOjE3NjkzNDI4OTJ9.UC-94_xGrbulPeQdUYvJK-lCn02bsLyZbx0i2hm88fg",
  "au_cbcs_phsdse601t_2025.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phsdse601t_2025.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNkc2U2MDF0XzIwMjUucGRmIiwiaWF0IjoxNzY4NzM4MDkyLCJleHAiOjE3NjkzNDI4OTJ9.xZq1uC7P50uSoTbHU2MX4trYlLU1CZZAetAJrAgfHZU",
  "au_cbcs_phshcc101t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc101t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MxMDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDkzLCJleHAiOjE3NjkzNDI4OTN9.QqjzzHcmCVdcvalyc35jrVzg7a8Q5fF72VBPK2WYZFE",
  "au_cbcs_phshcc102t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc102t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MxMDJ0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDkzLCJleHAiOjE3NjkzNDI4OTN9.tOg72liPQUUCgRzMCitGZPr-KdCMMHfs7WOqixRjYuY",
  "au_cbcs_phshcc201t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc201t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MyMDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDkzLCJleHAiOjE3NjkzNDI4OTN9.9GrZ39dix3gScnwKpAiTNiGeD4rl4i_5sn8gZg6UKNA",
  "au_cbcs_phshcc201t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc201t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MyMDF0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk0LCJleHAiOjE3NjkzNDI4OTR9.xckN8T1NJOjhSWaqxQf_7bXBjrjB1fKeo7HZNqOWxF0",
  "au_cbcs_phshcc201t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc201t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MyMDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk0LCJleHAiOjE3NjkzNDI4OTR9.9TgMP_GnAAhfqqkEP56RzOc5dTzFwfBM-EUGgtvefRY",
  "au_cbcs_phshcc202t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc202t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MyMDJ0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk0LCJleHAiOjE3NjkzNDI4OTR9.BjhLk4hlrUP1vWDAtTFHzqo6mybFIcam9rzDv6GgOts",
  "au_cbcs_phshcc301t_2020.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc301t_2020.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MzMDF0XzIwMjAucGRmIiwiaWF0IjoxNzY4NzM4MDk1LCJleHAiOjE3NjkzNDI4OTV9.WgC2dj16pYW49EYPM4Mg-cmPSGhjd8UGpRWxEbUrxes",
  "au_cbcs_phshcc301t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc301t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MzMDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk1LCJleHAiOjE3NjkzNDI4OTV9.LDMIGd6H2bAEmCyxvzVIfUdztGItTMl94PVjq4gK1AQ",
  "au_cbcs_phshcc303t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc303t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2MzMDN0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk1LCJleHAiOjE3NjkzNDI4OTV9.41ntJVdTwAoWccxdP8p8wGhDXZ_3-wUZJ8vAQiQ0w-4",
  "au_cbcs_phshcc401t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc401t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M0MDF0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk1LCJleHAiOjE3NjkzNDI4OTV9.5wdy7mnYgr2itSOjeqCL08K3gzBsn3ZRql1xosAgqbA",
  "au_cbcs_phshcc401t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc401t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M0MDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk2LCJleHAiOjE3NjkzNDI4OTZ9.zOMrvFq3M2_IEB6PyoU69DsUDHw9U44oLd1Z2BmiEiM",
  "au_cbcs_phshcc402t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc402t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M0MDJ0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk2LCJleHAiOjE3NjkzNDI4OTZ9.uIm9MGMEhIBxC500ny05WQFFwFWPHudeHzgzRk8JG8A",
  "au_cbcs_phshcc402t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc402t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M0MDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk2LCJleHAiOjE3NjkzNDI4OTZ9.ari2YyhvWk1tOfdP5IYYiK3OhFMWjj7Z_0YNZ7Gmbxk",
  "au_cbcs_phshcc403t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc403t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M0MDN0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk3LCJleHAiOjE3NjkzNDI4OTd9.3vkTHup9PUm6JADzMulmx-TyHlmrjCesG_kWs547IdY",
  "au_cbcs_phshcc501t_2020.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc501t_2020.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDF0XzIwMjAucGRmIiwiaWF0IjoxNzY4NzM4MDk3LCJleHAiOjE3NjkzNDI4OTd9._YRnzYxUKDLMIqvIy6bEi8CGLNysoiHZsZqEjZw0dHE",
  "au_cbcs_phshcc501t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc501t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk3LCJleHAiOjE3NjkzNDI4OTd9.L0zKlD5tNiYM5hBHpDqEBMYDvafPcbjAT9vbDoXLUik",
  "au_cbcs_phshcc502t_2020.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc502t_2020.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjAucGRmIiwiaWF0IjoxNzY4NzM4MDk3LCJleHAiOjE3NjkzNDI4OTd9.UmVO5G-gFNp1deIyEEtmUn1AGrDOZhz_nFbDLN_vb2w",
  "au_cbcs_phshcc502t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc502t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.74KSrWCL9Am8nxo3TjR9wR_ZijD0_ooDomsrTuQwFA4",
  "au_cbcs_phshcc502t_2022.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc502t_2022.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M1MDJ0XzIwMjIucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.p4Oby2yh5VuWn4yzK8aqDeh_ecBYGK0PEPF4x8PN7wQ",
  "au_cbcs_phshcc601t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.KoSpIaq7zUYZDyTsbkENYK-_K_iHSfeGkwyAzcTF7r4",
  "au_cbcs_phshcc601t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk4LCJleHAiOjE3NjkzNDI4OTh9.s08WsPKBNkMjccmYcJsml3aSpnPtjQ-dlTnbF064JiY",
  "au_cbcs_phshcc601t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc601t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.bHfv5TOQUY4e_Omfo3HanP_8T3zS53XM3e4vEyaJm04",
  "au_cbcs_phshcc602t_2021.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2021.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjEucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.vAXLDkZlbAQN1iY5Qrl7Gew7REa8nGUieqBUVyJGBB8",
  "au_cbcs_phshcc602t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.aOFKPwK9m-63MGmyK24an_SDBfVVl0bSexLsnTLbrZY",
  "au_cbcs_phshcc602t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_cbcs_phshcc602t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfY2Jjc19waHNoY2M2MDJ0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.Vv_SOqWCfeFOarLzo0oW5MknTxeuWIK3aHrpqJwk8ho",
  "au_fyug_phydsc101t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc101t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDF0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MDk5LCJleHAiOjE3NjkzNDI4OTl9.NAxEsOHaQ5jR8FcHjitetVGs0cQ_4tDIHAxcvdHnLTk",
  "au_fyug_phydsc101t_2024.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc101t_2024.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDF0XzIwMjQucGRmIiwiaWF0IjoxNzY4NzM4MTAwLCJleHAiOjE3NjkzNDI5MDB9.nBoBjkzWVNb9k9VhvC8FWKu6eFIiJOqjDoLFU6Z_aMI",
  "au_fyug_phydsc102t_2023.pdf": "https://jigeofftrhhyvnjpptxw.supabase.co/storage/v1/object/sign/papers/au_fyug_phydsc102t_2023.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV82MDRkZmE3Zi04ZGFhLTRjZGUtODFmNi0wNjQwOGYyMzljNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwYXBlcnMvYXVfZnl1Z19waHlkc2MxMDJ0XzIwMjMucGRmIiwiaWF0IjoxNzY4NzM4MTAwLCJleHAiOjE3NjkzNDI5MDB9.BbwtsUNjnY5wut__2E9o6_Ae0Rl9mPSpPySvajPeGow"
};

// ---------------- Helpers ----------------
function extractYear(path) {
  const m = path.match(/(20\d{2})/);
  return m ? m[1] : "—";
}

function extractShort(code) {
  return code.replace(/^AU(CBCS|FYUG)?/i, "");
}

function extractSemester(code) {
  // e.g. PHSDSE601T → Sem 6
  const m = code.match(/(\d)(0[1-8])/);
  if (!m) return "—";
  return `Sem ${m[2][1]}`;
}

// Resolve PDF URL (applies overrides when present)
function resolvePdfUrl(paperEntry) {
  // paperEntry.pdf examples:
  //   papers/assam-university/physics/cbcs_phsdse601t_2025_pdf
  //   papers/assam-university/physics/au_cbcs_phsdse601t_2025.pdf
  let base = paperEntry.pdf.split("/").pop(); // e.g. "cbcs_phsdse601t_2025_pdf"
  base = base.replace(/_pdf$/i, "");          // remove trailing _pdf
  if (!base.endsWith(".pdf")) base += ".pdf"; // ensure .pdf
  if (!base.toLowerCase().startsWith("au_")) {
    base = "au_" + base;                      // add au_ prefix if missing
  }
  const key = base.toLowerCase();
  return PDF_OVERRIDES[key] || paperEntry.pdf;
}

// ---------------- Load Paper ----------------
async function loadPaper() {
  const res = await fetch(PAPERS_URL);
  const all = await res.json();

  const matches = all.filter(p =>
    extractShort(p.paper_code) === SHORT_CODE.toUpperCase()
  );

  if (!matches.length) {
    document.querySelector(".paper-page").innerHTML =
      "<p class='coming-soon'>Paper not found.</p>";
    return;
  }

  const base = matches[0];
  const semester = extractSemester(base.paper_code);

  // Header
  document.getElementById("paperTitle").textContent =
    base.paper_name || "Paper title pending";

  document.getElementById("paperCode").textContent =
    extractShort(base.paper_code);

  document.getElementById("paperMeta").textContent =
    `Assam University • ${base.programme} • ${base.stream.toUpperCase()} • ${semester}`;

  // Latest PDF
  const sorted = [...matches].sort(
    (a, b) => extractYear(b.pdf) - extractYear(a.pdf)
  );

  const latest = sorted[0];
  const latestUrl = resolvePdfUrl(latest);

  const latestBtn = document.getElementById("latestPdfLink");
  latestBtn.href = latestUrl;
  latestBtn.textContent = `Open Latest PDF (${extractYear(latest.pdf)}) →`;

  // Available papers
  const list = document.getElementById("availablePapers");
  list.innerHTML = "";

  sorted.forEach(p => {
    const url = resolvePdfUrl(p);
    const li = document.createElement("li");
    li.innerHTML = `
      <a href="${url}" target="_blank">
        ${extractYear(p.pdf)} Question Paper →
      </a>
    `;
    list.appendChild(li);
  });

  // Optional sections
  loadOptional(
    `${SYLLABUS_BASE}${base.paper_code}.json`,
    "syllabus-container",
    "no-syllabus"
  );

  loadOptional(
    `${RQ_BASE}${base.paper_code}.json`,
    "repeated-container"
  );
}

// ---------------- Optional loaders ----------------
async function loadOptional(url, containerId, fallbackId) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const data = await res.json();
    document.getElementById(containerId).textContent =
      JSON.stringify(data, null, 2);
  } catch {
    if (fallbackId) {
      document.getElementById(fallbackId).hidden = false;
    }
  }
}

// ---------------- Init ----------------
loadPaper();
