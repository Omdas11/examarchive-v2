/**
 * ExamArchive v2 — Browse Page
 * FINAL STABLE VERSION (Schema-aligned) with signed-URL overrides
 */

const DATA_URL = "./data/papers.json";

// --------------------
// Overrides for signed URLs
// --------------------
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

// Resolve PDF URL (applies overrides when present)
function resolvePdfUrl(paperEntry) {
  let base = paperEntry.pdf.split("/").pop();
  base = base.replace(/_pdf$/i, "");
  if (!base.endsWith(".pdf")) base += ".pdf";
  base = base.toLowerCase();

  const withAu = base.startsWith("au_") ? base : "au_" + base;
  const candidates = [
    withAu,
    base,
    base.replace(/^au_/, "")
  ];

  for (const key of candidates) {
    if (PDF_OVERRIDES[key]) return PDF_OVERRIDES[key];
  }

  console.warn("Missing override for", candidates[0], "fallback:", paperEntry.pdf);
  return paperEntry.pdf;
}

// --------------------
// Helpers
// --------------------
const norm = v => String(v || "").toLowerCase();

// --------------------
// Load JSON
// --------------------
async function loadPapers() {
  const res = await fetch(DATA_URL);
  allPapers = await res.json();
}

// --------------------
// Year Toggle
// --------------------
function buildYearToggle() {
  const yearToggle = document.getElementById("yearToggle");
  yearToggle.innerHTML = "";

  const years = [...new Set(allPapers.map(p => p.year))]
    .sort((a, b) => b - a);

  const allBtn = document.createElement("button");
  allBtn.className = "toggle-btn active";
  allBtn.textContent = "ALL";
  allBtn.onclick = () => {
    setActive(yearToggle, allBtn);
    filters.year = "ALL";
    applyFilters();
  };
  yearToggle.appendChild(allBtn);

  years.forEach(year => {
    const btn = document.createElement("button");
    btn.className = "toggle-btn";
    btn.textContent = year;
    btn.onclick = () => {
      setActive(yearToggle, btn);
      filters.year = String(year);
      applyFilters();
    };
    yearToggle.appendChild(btn);
  });
}

// --------------------
// Filters
// --------------------
function applyFilters() {
  view = [...allPapers];

  // Programme
  if (filters.programme !== "ALL") {
    view = view.filter(p => p.programme === filters.programme);
  }

  // Stream (JSON uses lowercase)
  view = view.filter(p => norm(p.stream) === norm(filters.stream));

  // Year
  if (filters.year !== "ALL") {
    view = view.filter(p => String(p.year) === filters.year);
  }

  // Search
  if (filters.search) {
    view = view.filter(p =>
      norm(p.paper_names.join(" ")).includes(filters.search) ||
      norm(p.paper_codes.join(" ")).includes(filters.search) ||
      String(p.year).includes(filters.search)
    );
  }

  // Sort
  view.sort((a, b) =>
    filters.sort === "newest" ? b.year - a.year : a.year - b.year
  );

  render();
}

// --------------------
// Render Cards
// --------------------
function render() {
  const list = document.getElementById("papersList");
  const count = document.getElementById("paperCount");

  list.innerHTML = "";
  count.textContent = `Showing ${view.length} papers`;

  if (!view.length) {
    list.innerHTML = `<p class="empty">No papers found.</p>`;
    return;
  }

  view.forEach(p => {
    const title = p.paper_names.join(" / ");
    const code = p.paper_codes.join(" / ");
    const pdfUrl = resolvePdfUrl(p);

    const card = document.createElement("div");
    card.className = "paper-card";

    card.onclick = () => {
      window.location.href = `paper.html?code=${p.paper_codes[0]}`;
    };

    card.innerHTML = `
      <h3 class="paper-name">${title}</h3>
      <div class="paper-code">${code}</div>
      <div class="paper-meta">
        ${p.university} • ${p.programme} • ${p.stream} • Sem ${p.semester} • ${p.year}
      </div>
      <a class="open-pdf" href="${pdfUrl}" target="_blank" onclick="event.stopPropagation()">
        Open PDF →
      </a>
    `;

    list.appendChild(card);
  });
}

// --------------------
// UI Helpers
// --------------------
function setActive(group, btn) {
  group.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// --------------------
// Bind Controls
// --------------------
document.querySelectorAll("[data-programme]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-programme]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.programme = btn.dataset.programme;
    applyFilters();
  };
});

document.querySelectorAll("[data-stream]").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll("[data-stream]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filters.stream = btn.dataset.stream;
    applyFilters();
  };
});

document.getElementById("searchInput").addEventListener("input", e => {
  filters.search = norm(e.target.value);
  applyFilters();
});

document.getElementById("sortSelect").addEventListener("change", e => {
  filters.sort = e.target.value;
  applyFilters();
});

// --------------------
// Init
// --------------------
(async function init() {
  await loadPapers();
  buildYearToggle();
  applyFilters();
})();
