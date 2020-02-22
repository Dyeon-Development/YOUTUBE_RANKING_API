# YOUTUBE_RANKING_SYSTEM
API Server

## REST API WIKI
[REST API 문서][Page](https://github.com/Dyeon-Development/YOUTUBE_RANKING_API/wiki)

## Architecture

<img src="https://github.com/TEAM-WITH/WITH_Server/blob/master/images/server_structure.png" width="800px" height="600px"></img><br/>

## ERD

<img src="https://github.com/TEAM-WITH/WITH_Server/blob/master/images/WITH_ERD.png" width="550px" height="700px"></img><br/>

## 핵심 기능
 - 일주일 간 4가지 지표를 활용해 등록된 유튜버들의 순위를 매길 수 있다.
 
 
## package

 - aws-sdk : AWS 서비스를 위한 JavaScript 객체가 제공
 - crypto-promise : 패스워드 암호화 및 인증을 지원하는 모듈의 비동기 버전
 - jsonwebtoken : JWT(Json Web Token) 생성 및 인증
 - moment : 날짜(Date)형식 데이터의 파싱, 검증, 조작
 - multer-s3 : AWS S3 파일 업로드 도구
 - node-cron : Cron은 유닉스 계열 컴퓨터 운영 체제의 시간 기반 Job 스케줄러
 - promise-mysql : mysql의 비동기 버전
 
<pre><code>
  "dependencies": {
    "aws-sdk": "^2.596.0",
    "charset": "^1.0.1",
    "cookie-parser": "^1.4.4",
    "crypto": "^1.0.1",
    "crypto-promise": "^2.1.0",
    "debug": "~2.6.9",
    "express": "^4.16.4",
    "http-errors": "^1.6.3",
    "iconv": "^2.3.5",
    "iconv-lite": "^0.5.0",
    "jade": "~1.11.0",
    "jsonwebtoken": "^8.5.1",
    "moment": "^2.24.0",
    "moment-timezone": "^0.5.27",
    "morgan": "~1.9.1",
    "multer": "^1.4.2",
    "multer-s3": "^2.9.0",
    "node-cron": "^2.0.3",
    "nodemon": "^2.0.2",
    "promise-mysql": "^4.1.1",
    "urlencode": "^1.1.0",
    "util": "^0.12.1"
  }
</code></pre>

---------------------------------------

## 팀원

### 프론트엔드 [Page](https://github.com/Dyeon-Development/YOUTUBE_RANKING_API)

* 박희융

### 서버 [Page](https://github.com/Dyeon-Development/YOUTUBE_RANKING_API)

* 박형모
