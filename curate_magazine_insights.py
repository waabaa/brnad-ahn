from __future__ import annotations

import argparse
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "brand_data.sqlite"


CURATED_INSIGHTS = [
    {
        "brand": "BMW",
        "type": "design_philosophy",
        "claim": "BMW는 이동수단을 만드는 회사를 넘어, 주행 감각과 조형 언어를 함께 설계하는 디자인 브랜드다.",
        "explanation": "BMW의 강점은 성능 수치만으로 설명되지 않는다. 운전자가 차를 보고, 만지고, 움직이는 순간에 느끼는 긴장감과 안정감이 하나의 브랜드 경험으로 조직된다.",
        "evidence": ["BMW", "디자인"],
    },
    {
        "brand": "BMW",
        "type": "cultural_meaning",
        "claim": "BMW의 브랜드 문화는 속도보다 통제된 역동성에 가깝다.",
        "explanation": "강한 주행 성능을 앞세우면서도 브랜드가 반복해서 전달하는 감각은 무모함이 아니라 정교하게 제어되는 힘이다.",
        "evidence": ["BMW", "안전"],
    },
    {
        "brand": "스타벅스",
        "type": "experience_strategy",
        "claim": "스타벅스는 커피를 팔면서 동시에 사람들이 머무는 시간과 공간의 감각을 설계한다.",
        "explanation": "음료는 핵심 상품이지만, 브랜드의 차별성은 매장 안에서 보내는 시간, 주문 언어, 조명, 좌석, 컵과 로고가 결합된 체류 경험에서 완성된다.",
        "evidence": ["스타벅스", "공간"],
    },
    {
        "brand": "스타벅스",
        "type": "brand_meaning",
        "claim": "스타벅스의 비즈니스는 커피 사업이면서 동시에 사람 중심의 관계 사업이다.",
        "explanation": "브랜드의 힘은 커피 맛만이 아니라 고객과 직원이 공유하는 태도, 반복 방문의 리듬, 일상 속 의식처럼 작동하는 매장 경험에서 나온다.",
        "evidence": ["커피 사업", "사람 중심"],
    },
    {
        "brand": "나이키",
        "type": "consumer_psychology",
        "claim": "나이키는 스포츠용품보다 자기극복의 서사를 더 강하게 판매하는 브랜드다.",
        "explanation": "신발과 의류는 제품이지만, 소비자가 실제로 구매하는 것은 기록을 갱신하고 자신을 증명하고 싶은 감정이다. 나이키의 커뮤니티와 디지털 서비스는 이 감정을 지속시키는 장치로 작동한다.",
        "evidence": ["나이키", "커뮤니티"],
    },
    {
        "brand": "나이키",
        "type": "cultural_meaning",
        "claim": "나이키의 헤리티지는 승리의 이미지를 현대적 소비문화로 번역하는 데 있다.",
        "explanation": "브랜드명과 상징은 고대적 승리의 감각을 빌려오지만, 그것을 운동장 밖의 일상과 팬덤, 자기관리 문화로 확장한다.",
        "evidence": ["나이키", "그리스"],
    },
    {
        "brand": "애플",
        "type": "strategic_positioning",
        "claim": "애플에게 혁신은 일회성 전략이 아니라 조직의 습관처럼 반복되는 브랜드 행동이다.",
        "explanation": "애플은 새로움을 캠페인으로만 말하지 않는다. 제품, 인터페이스, 매장, 발표 방식까지 같은 태도로 정렬해 변화 자체를 브랜드의 일상적 리듬으로 만든다.",
        "evidence": ["애플", "관습"],
    },
    {
        "brand": "애플",
        "type": "experience_strategy",
        "claim": "애플은 기기를 판매하지만, 실제로는 사용자가 기술을 대하는 방식을 바꾼다.",
        "explanation": "제품의 기능보다 중요한 것은 사용자가 기기를 자연스럽게 이해하고, 연결하고, 자신의 생활 방식 안에 편입시키는 경험이다.",
        "evidence": ["애플", "경험"],
    },
    {
        "brand": "애플",
        "type": "brand_meaning",
        "claim": "애플의 마케팅은 제품 설명보다 자기다움을 통해 차이를 만드는 브랜딩에 가깝다.",
        "explanation": "애플은 사양 경쟁에 머물지 않고, 단순함과 통합성, 사용자의 감각을 통해 왜 다른 브랜드인지 설명한다.",
        "evidence": ["애플", "마케팅"],
    },
    {
        "brand": "맥도날드",
        "type": "cultural_meaning",
        "claim": "맥도날드는 가장 평범한 소비재를 세계 어디서나 읽히는 대중문화의 기호로 바꾼 브랜드다.",
        "explanation": "햄버거와 감자튀김은 단순한 메뉴지만, 맥도날드는 속도, 표준화, 접근성, 익숙함을 결합해 글로벌 일상의 상징을 만들었다.",
        "evidence": ["맥도날드", "브랜드"],
    },
    {
        "brand": "자라",
        "type": "strategic_positioning",
        "claim": "자라는 패션을 예측하기보다 시장의 반응을 빠르게 읽고 다시 매장으로 돌려보내는 브랜드다.",
        "explanation": "트렌드를 길게 기획하는 대신 고객 반응과 유통 속도를 무기로 삼아, 패션을 고정된 컬렉션이 아니라 순환하는 시스템으로 다룬다.",
        "evidence": ["자라"],
    },
    {
        "brand": "할리데이비슨",
        "type": "cultural_meaning",
        "claim": "할리데이비슨은 모터사이클보다 자유와 소속감의 의식을 더 강하게 판매한다.",
        "explanation": "제품은 이동수단이지만 브랜드의 핵심은 엔진음, 라이딩 문화, 커뮤니티, 반항적 이미지가 결합된 정체성 경험이다.",
        "evidence": ["할리데이비슨"],
    },
    {
        "brand": "코카-콜라",
        "type": "brand_meaning",
        "claim": "코카-콜라는 음료의 맛보다 함께 마시는 순간의 감정을 브랜드 자산으로 축적해 왔다.",
        "explanation": "병의 형태, 색, 광고 언어, 공유의 장면이 반복되면서 제품은 탄산음료를 넘어 친숙함과 즐거움의 상징이 된다.",
        "evidence": ["코카콜라"],
    },
    {
        "brand": "미니",
        "type": "design_philosophy",
        "claim": "미니는 작은 크기를 약점이 아니라 개성과 태도의 언어로 바꾼 자동차 브랜드다.",
        "explanation": "미니의 디자인은 실용성만을 말하지 않는다. 작음, 경쾌함, 도시적 감각을 결합해 차체 자체를 하나의 캐릭터처럼 인식시킨다.",
        "evidence": ["미니"],
    },
    {
        "brand": "탐스",
        "type": "brand_meaning",
        "claim": "탐스는 제품 구매를 개인의 선의와 연결한 참여형 브랜드다.",
        "explanation": "신발은 상품이지만, 브랜드의 차별성은 소비자가 구매 행위를 통해 사회적 의미에 참여한다고 느끼게 만든 구조에 있다.",
        "evidence": ["탐스", "명분"],
    },
    {
        "brand": "유니클로",
        "type": "strategic_positioning",
        "claim": "유니클로는 패션을 유행의 장식이 아니라 생활을 구성하는 공산품처럼 다룬다.",
        "explanation": "브랜드의 힘은 화려한 스타일보다 베이직, 품질, 가격, 운영 시스템을 일관되게 정렬하는 데서 나온다.",
        "evidence": ["유니클로", "공산품"],
    },
    {
        "brand": "루이비통",
        "type": "brand_meaning",
        "claim": "루이비통은 여행가방에서 출발했지만, 이동의 기능을 럭셔리한 삶의 상징으로 확장했다.",
        "explanation": "브랜드의 헤리티지는 물건을 담는 도구가 아니라 이동하는 사람의 취향과 지위를 표현하는 방식으로 발전했다.",
        "evidence": ["루이비통"],
    },
    {
        "brand": "인텔",
        "type": "strategic_positioning",
        "claim": "인텔은 보이지 않는 부품을 소비자가 인식하는 브랜드로 만든 대표적 사례다.",
        "explanation": "컴퓨터 내부의 기술을 밖으로 끌어내어 신뢰와 성능의 이름으로 각인시킨 점이 인텔 브랜딩의 핵심이다.",
        "evidence": ["인텔"],
    },
    {
        "brand": "필립스",
        "type": "brand_meaning",
        "claim": "필립스는 기술을 과시하기보다 생활을 더 단순하고 건강하게 만드는 방향으로 브랜드 의미를 확장해 왔다.",
        "explanation": "전기·전자 기술은 기반이지만, 소비자가 인식하는 가치는 일상의 편의와 건강한 삶을 돕는 실용성에 있다.",
        "evidence": ["필립스"],
    },
    {
        "brand": "뱅앤올룹슨",
        "type": "design_philosophy",
        "claim": "뱅앤올룹슨은 오디오를 가전제품이 아니라 공간 속 오브제로 다루는 브랜드다.",
        "explanation": "소리의 품질뿐 아니라 제품이 놓이는 방식, 재료, 형태, 조작 경험까지 디자인의 일부로 통합한다.",
        "evidence": ["뱅앤올룹슨"],
    },
    {
        "brand": "러쉬",
        "type": "brand_meaning",
        "claim": "러쉬는 화장품을 신선함과 윤리적 소비의 감각으로 재해석한 브랜드다.",
        "explanation": "강한 향, 손으로 만든 듯한 질감, 포장 최소화, 사회적 메시지가 제품 경험과 결합해 독특한 브랜드 태도를 만든다.",
        "evidence": ["러쉬"],
    },
    {
        "brand": "파타고니아",
        "type": "cultural_meaning",
        "claim": "파타고니아는 아웃도어 브랜드이면서 동시에 소비를 줄이라는 역설적 메시지로 신뢰를 쌓은 브랜드다.",
        "explanation": "제품을 파는 기업이지만 브랜드의 설득력은 자연, 책임, 오래 쓰는 태도를 일관되게 말하는 데서 나온다.",
        "evidence": ["파타고니아"],
    },
    {
        "brand": "아마존",
        "type": "experience_strategy",
        "claim": "아마존은 쇼핑몰보다 고객의 기다림과 탐색 비용을 줄이는 시스템 브랜드에 가깝다.",
        "explanation": "상품 범위, 검색, 추천, 배송, 결제 경험이 하나로 연결되면서 브랜드의 가치는 편리함과 예측 가능성으로 축적된다.",
        "evidence": ["아마존"],
    },
    {
        "brand": "코치",
        "type": "brand_meaning",
        "claim": "코치는 실용적 가죽 제품을 일상적 럭셔리의 영역으로 끌어올린 브랜드다.",
        "explanation": "과시적 명품보다 접근 가능한 품질과 라이프스타일 이미지를 통해 오래 쓰는 가방의 감각을 브랜드화했다.",
        "evidence": ["코치"],
    },
    {
        "brand": "티파니",
        "type": "design_philosophy",
        "claim": "티파니는 주얼리 자체만큼이나 색과 포장, 선물의 의식을 브랜드 자산으로 만든다.",
        "explanation": "블루 박스와 매장 경험은 제품을 구매하는 순간을 특별한 사건으로 바꾸며, 브랜드의 상징성을 강화한다.",
        "evidence": ["티파니"],
    },
    {
        "brand": "옥소",
        "type": "design_philosophy",
        "claim": "옥소는 평범한 주방 도구를 사용자의 몸과 습관에 맞춘 디자인 문제로 바라본다.",
        "explanation": "제품의 차별성은 장식보다 손에 잡히는 감각, 사용 편의, 반복되는 동작을 세심하게 개선하는 태도에 있다.",
        "evidence": ["옥소"],
    },
    {
        "brand": "앱솔루트",
        "type": "cultural_meaning",
        "claim": "앱솔루트는 보드카 병 하나를 광고와 예술의 반복 가능한 캔버스로 만든 브랜드다.",
        "explanation": "제품 형태의 일관성을 유지하면서도 캠페인마다 다른 문화적 해석을 입혀, 단순한 병을 강력한 시각 기호로 만들었다.",
        "evidence": ["앱솔루트"],
    },
    {
        "brand": "샤넬",
        "type": "brand_meaning",
        "claim": "샤넬은 패션을 장식이 아니라 태도와 해방의 언어로 바꾼 브랜드다.",
        "explanation": "브랜드의 힘은 제품의 고급스러움뿐 아니라 여성의 몸과 생활 방식을 새롭게 해석한 상징성에서 나온다.",
        "evidence": ["샤넬"],
    },
    {
        "brand": "에르메스",
        "type": "brand_meaning",
        "claim": "에르메스는 속도보다 장인성과 기다림의 가치를 브랜드 경험으로 만든다.",
        "explanation": "제품은 희소성과 품질을 통해 욕망을 만들지만, 더 깊은 차별성은 쉽게 대체되지 않는 제작 태도와 시간의 감각에 있다.",
        "evidence": ["에르메스"],
    },
    {
        "brand": "프라다",
        "type": "design_philosophy",
        "claim": "프라다는 아름다움을 익숙한 화려함보다 지적인 긴장감으로 표현하는 브랜드다.",
        "explanation": "소재와 형태, 절제된 색감은 패션을 단순한 장식이 아니라 관찰과 해석의 대상으로 만든다.",
        "evidence": ["프라다"],
    },
    {
        "brand": "스와치",
        "type": "strategic_positioning",
        "claim": "스와치는 시계를 고가의 정밀기기에서 매일 바꿔 착용할 수 있는 패션 언어로 전환했다.",
        "explanation": "시간을 알려주는 기능보다 색, 그래픽, 컬렉션, 가벼운 가격대가 브랜드 경험의 중심이 된다.",
        "evidence": ["스와치"],
    },
    {
        "brand": "더바디샵",
        "type": "brand_meaning",
        "claim": "더바디샵은 화장품을 윤리적 소비와 사회적 메시지를 담는 매개로 확장한 브랜드다.",
        "explanation": "제품의 효능만큼이나 동물실험 반대, 공정 거래, 환경 의식 같은 태도가 브랜드 선택의 이유가 된다.",
        "evidence": ["더바디샵"],
    },
    {
        "brand": "빅토리아 시크릿",
        "type": "cultural_meaning",
        "claim": "빅토리아 시크릿은 속옷을 기능적 제품이 아니라 무대화된 판타지와 자기표현의 이미지로 포장한 브랜드다.",
        "explanation": "브랜드는 제품보다 쇼, 모델, 시각적 연출을 통해 소비자가 상상하는 매력의 장면을 판매해 왔다.",
        "evidence": ["빅토리아 시크릿"],
    },
    {
        "brand": "몽블랑",
        "type": "brand_meaning",
        "claim": "몽블랑은 필기구를 기록의 도구에서 성취와 품격의 상징으로 끌어올린 브랜드다.",
        "explanation": "만년필은 기능 제품이지만, 브랜드가 축적한 이미지는 서명, 의사결정, 지적 권위 같은 장면과 결합된다.",
        "evidence": ["몽블랑"],
    },
    {
        "brand": "리바이스",
        "type": "cultural_meaning",
        "claim": "리바이스는 청바지를 작업복에서 세대와 태도를 드러내는 문화적 유니폼으로 바꾼 브랜드다.",
        "explanation": "튼튼한 바지는 시간이 지나며 자유, 젊음, 반항, 일상성을 담는 상징으로 확장되었다.",
        "evidence": ["리바이스"],
    },
]


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="Insert reviewed, public-safe editorial brand insight sentences.")
    parser.add_argument("--db", type=Path, default=DB_PATH)
    args = parser.parse_args()

    conn = sqlite3.connect(args.db)
    conn.row_factory = sqlite3.Row
    inserted = 0
    skipped = 0

    for item in CURATED_INSIGHTS:
        brand = conn.execute("SELECT id FROM brand_entities WHERE canonical_name = ?", (item["brand"],)).fetchone()
        if not brand:
            skipped += 1
            continue
        brand_id = int(brand["id"])
        evidence = None
        for keyword in item.get("evidence", []):
            evidence = conn.execute(
                """
                SELECT * FROM brand_insights
                WHERE brand_id = ?
                  AND (internal_evidence_text LIKE ? OR public_claim LIKE ? OR public_explanation LIKE ?)
                ORDER BY confidence DESC, id
                LIMIT 1
                """,
                (brand_id, f"%{keyword}%", f"%{keyword}%", f"%{keyword}%"),
            ).fetchone()
            if evidence:
                break
        if not evidence:
            evidence = conn.execute(
                "SELECT * FROM brand_insights WHERE brand_id = ? ORDER BY confidence DESC, id LIMIT 1",
                (brand_id,),
            ).fetchone()
        if not evidence:
            skipped += 1
            continue

        before = conn.total_changes
        conn.execute(
            """
            INSERT OR IGNORE INTO brand_insights (
                brand_id, insight_type, public_claim, public_explanation,
                internal_evidence_text, internal_source_document_id,
                internal_page_number, confidence, editorial_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
            """,
            (
                brand_id,
                item["type"],
                item["claim"],
                item["explanation"],
                evidence["internal_evidence_text"],
                evidence["internal_source_document_id"],
                evidence["internal_page_number"],
                0.95,
            ),
        )
        inserted += max(0, conn.total_changes - before)

    conn.commit()
    print(f"approved insights inserted: {inserted}")
    print(f"skipped: {skipped}")


if __name__ == "__main__":
    import argparse

    main()
