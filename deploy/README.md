# 브랜드 아틀라스 배포 가이드 (Ubuntu + Nginx)

대상 도메인: **brand.resort.co.kr**
배포 방식: 정적 파일 rsync + Nginx 서빙 (빌드 스텝 없음)

## 1. 아키텍처

```
[로컬 WSL2]  web-design/brand_atlas_handoff/   (정적 산출물)
     │  rsync -az --delete (deploy.sh)
     ▼
[Ubuntu 서버]  /var/www/brand-atlas/           (document root)
     │  Nginx (gzip, cache-control, TLS)
     ▼
[사용자]  https://brand.resort.co.kr
```

배포 대상에서 제외되는 디렉토리: `scripts/`, `source-imports/`, `reports/`,
`archive/`, `.playwright-*`, `*.bak`, 개발용 `README.md` / 작업지시서.

## 2. 최초 1회 서버 설정

```bash
# 서버에서
sudo mkdir -p /var/www/brand-atlas
sudo chown -R "$USER":www-data /var/www/brand-atlas

# Nginx 사이트 등록 (로컬의 deploy/nginx-brand-atlas.conf를 서버로 복사 후)
sudo cp nginx-brand-atlas.conf /etc/nginx/sites-available/brand-atlas.conf
sudo ln -s /etc/nginx/sites-available/brand-atlas.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# DNS: brand.resort.co.kr A 레코드가 이 서버를 가리키는지 확인 후 TLS 발급
sudo certbot --nginx -d brand.resort.co.kr
```

## 3. 배포 (매 릴리스)

로컬에서:

```bash
# 미리보기 (실제 전송 없음)
SSH_TARGET=<user>@brand.resort.co.kr ./deploy/deploy.sh --dry-run

# 실제 배포
SSH_TARGET=<user>@brand.resort.co.kr ./deploy/deploy.sh
```

`deploy.sh`는 rsync 후 `sudo nginx -t && systemctl reload nginx`까지 수행합니다.
(서버 계정에 무중단 reload용 sudo 권한이 필요합니다.)

## 4. 캐시 무효화

- `index.html` 및 모든 `.html`, `data/brand-atlas.json` → `Cache-Control: no-cache` (즉시 반영)
- `app.js` / `styles.css` → `?v=YYYYMMDD` 쿼리로 캐시 버스팅. 데이터/코드 변경 릴리스
  시 `index.html`·`pages/*.html`의 `?v=` 값을 함께 올리세요.
- 정적 이미지(`images/`, `assets/`) → 1년 캐시(immutable). 파일명이 콘텐츠 해시는
  아니므로, 같은 경로로 이미지를 교체하면 강한 캐시로 인해 갱신이 늦을 수 있습니다.

## 5. 배포 후 점검

```bash
curl -I https://brand.resort.co.kr/                         # 200, no-cache 헤더
curl -s https://brand.resort.co.kr/data/brand-atlas.json | head -c 200
```

브라우저에서 홈, 산업별 탐색, 브랜드 상세(`?brand=apple`), 검색 동작과
로고/워드마크 표시를 확인합니다.
