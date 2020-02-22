# YOUTUBE_RANKING_SYSTEM
API Server

## REST API WIKI
[REST API 문서](https://github.com/Dyeon-Development/YOUTUBE_RANKING_API/wiki)

## Architecture

<img src="https://github.com/Dyeon-Development/YOUTUBE_RANKING_API/blob/master/images/dyeon_architecture.png" width="500px" height="350px"></img><br/>

## Database Diagram

<img src="https://github.com/Dyeon-Development/YOUTUBE_RANKING_API/blob/master/images/database_diagram.png" width="600px" height="400px"></img><br/>

## 핵심 기능

 - 일주일 간 수집한 데이터들을 활용해 4가지 지표를 생성하고, 이 지표들을 기반으로 등록된 유튜버들의 순위를 매길 수 있다.
 - 순위를 매긴 유튜버들을 리스트화 하여 조회할 수 있다.
 - 유튜버의 상세 정보들을 조회할 수 있다.
 - admin page 에서 순위를 매길 유튜버들을 추가, 수정, 삭제할 수 있다.
 
 
## package

 - axios : Youtube data API에 요청하기 위한 모듈
 - bcrypt : 패스워드 암호화 및 인증을 지원하는 모듈
 - dotenv : 개인 정보들을 관리하는 .env 파일을 사용하기 위한 모듈
 - jsonwebtoken : JWT(Json Web Token) 생성 및 인증
 - moment : 날짜(Date)형식 데이터의 파싱, 검증, 조작
 - mongoose : mongoDB의 ORM 라이브러리 
 - node-cron : Job 스케줄러 Cron을 사용하기 위한 모듈
 - nodemon : 실시간 변경을 적용할 수 있는 모듈
 
<pre><code>
  "dependencies": {
    "axios": "^0.19.2",
    "bcrypt": "^3.0.8",
    "cookie-parser": "^1.4.4",
    "dotenv": "^8.2.0",
    "express": "^4.16.3",
    "jsonwebtoken": "^8.5.1",
    "moment": "^2.24.0",
    "moment-duration-format": "^2.3.2",
    "moment-timezone": "^0.5.27",
    "mongodb-backup-fixed": "^1.7.2",
    "mongoose": "^5.8.11",
    "node-cron": "^2.0.3",
    "nodemon": "^2.0.2"
  }
</code></pre>

---------------------------------------

## 팀원

### 프론트엔드 [Page](https://github.com/Dyeon-Development/YOUTUBE_RANKING_API)

* 박희융

### 서버 [Page](https://github.com/Dyeon-Development/YOUTUBE_RANKING_API)

* 박형모
