# brandatlas.co.kr — Phase E slug 이전 301 설정

`scripts/migrate-slugs.mjs`가 무의미 slug(`brand-<번호>`, `brandarchive-*`, 비ASCII)를
브랜드명 기반 slug로 바꾸면서 구 URL 519건이 사라진다. 이미 색인된 페이지의 검색
자산을 잃지 않으려면 구 URL이 신 URL로 **301**을 반환해야 한다.

## 적용 방법

`deploy/apply-redirects.sh`가 아래를 자동으로 수행한다. 수동으로 할 경우:

1. map 파일 업로드
   ```bash
   scp -i ~/.ssh/resort_developer_temp deploy/brandatlas-redirects.map \
       developer@test.resort.co.kr:/home/developer/
   ssh -i ~/.ssh/resort_developer_temp developer@test.resort.co.kr \
       'sudo -n cp /home/developer/brandatlas-redirects.map /etc/nginx/brandatlas-redirects.map'
   ```

2. `/etc/nginx/sites-enabled/brandatlas.co.kr.conf` 최상단(server 블록 **밖**)에 map 추가
   ```nginx
   map $uri $brandatlas_redirect {
       default "";
       include /etc/nginx/brandatlas-redirects.map;
   }
   ```
   `map`은 http 컨텍스트 지시어이고 sites-enabled는 http 안에서 include되므로
   이 파일 상단에 두면 된다.

3. 443 server 블록 최상단(다른 location보다 앞)에 리다이렉트 추가
   ```nginx
   if ($brandatlas_redirect != "") { return 301 https://brandatlas.co.kr$brandatlas_redirect; }
   ```
   server 컨텍스트의 `if`는 일반적으로 피해야 하지만 `return`만 쓰는 형태는
   nginx가 명시적으로 안전하다고 보장하는 두 가지 용법 중 하나다.

4. 검증 후 reload
   ```bash
   sudo -n nginx -t && sudo -n systemctl reload nginx
   ```

## 검증

```bash
# 301과 Location 헤더 확인
curl -sI https://brandatlas.co.kr/brand/brand-440.html | head -3
# → HTTP/2 301 / location: https://brandatlas.co.kr/brand/walmart.html

# 전건 검증
node web-design/brand_atlas_handoff/scripts/verify-redirects.mjs
```

## 되돌리기

map include 두 줄과 `if` 한 줄을 제거하고 reload하면 리다이렉트가 사라진다.
slug 자체를 되돌리려면 `data/brand-atlas.json.bak-pre-slug-migration`을 복원한 뒤
재빌드·재배포한다.
