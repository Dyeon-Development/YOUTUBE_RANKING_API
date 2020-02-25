var express = require('express');
var router = express.Router();
const Video = require('../models/video');
const Channel = require('../models/channel');
const User = require('../models/user');
const authUtil = require('../module/authUtil');
const missParameters = require('../module/missParameters');
const axios = require('axios');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
require("moment-duration-format");
require('dotenv').config();
router.use('/auth', require('./auth'));
const APP_KEY = process.env.APP_KEY;

// 유튜버 랭킹 전체 조회 라우트
// 선택 X : params 자리에 '0' 입력 
router.get('/:sort/:category/:keyword/:page', async (req, res) => {
    let condition = {
        // 오늘 업데이트된 데이터 출력
        createdAt: {"$gte": moment().format('YYYY-MM-DD')}
    };
    let sort;
    if(req.params.category !== '0'){
        condition.category = req.params.category;
    }
    if(req.params.keyword !== '0')
    {
        // 입력받은 키워드가 포함된 document를 출력
        condition.channel_name = { $regex: '.*' + req.params.keyword + '.*' };
    }
    if(req.params.sort !== '0')
    {
        // params로부터 입력받은 조건으로 내림차순
        sort = [[req.params.sort, 'descending']];
    }
    // 10개씩 페이지네이션 하면서 출력
    const result = await Channel
    .find(condition)
    .sort(sort)
    .skip((10 * req.params.page) - 10)
    .limit(10);
    // 최대 출력 가능 페이지 수 출력
    const maxPage = Math.ceil(await Channel.countDocuments(condition) / 10);
    return res.status(200).send({
        result,
        maxPage,
    });
});

// 유튜버 상세 조회
router.get('/youtuber/:id', async (req, res) => {
    const result = await Channel
    .find({id: req.params.id})
    .sort([['createdAt', 'descending']]);
    // 비디오 중 최대 조회 수 출력
    const max_view = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {viewCount: -1 }})
    .select('viewCount');
    // 비디오 중 최대 좋아요 수 출력
    const max_like = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {likeCount: -1 }})
    .select('likeCount');
    // 비디오 중 최대 싫어요 수 출력
    const max_dislike = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {dislikeCount: -1 }})
    .select('dislikeCount');
    // 비디오 중 최대 댓글 수 출력
    const max_comment = await Video
    .findOne({channel: result[0]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, null, {sort: {commentCount: -1 }})
    .select('commentCount');
    return res.status(200).send({
            result,
            max_view: max_view.viewCount,
            max_like: max_like.likeCount,
            max_dislike: max_dislike.dislikeCount,
            max_comment: max_comment.commentCount,
        });
});

// admin page 출력 (미들웨어를 이용한 인증 처리)
router.get('/admin/:page', authUtil.validToken, async (req, res) => {
    const maxPage = Math.ceil(await User.countDocuments() / 10);
    const result = await User
    .find({})
    .sort([['createdAt', 'descending']])
    .skip((10 * req.params.page) - 10)
    .limit(10);
    return res.status(200).send({
        result,
        maxPage,
    });
});

router.post('/admin', authUtil.validToken, async (req, res) => {
    // request body로부터 로그인 정보를 받는다.
    let json = {};
    json.id  = req.body.id;
    json.name = req.body.name;
    // miss parameter가 있는지 검사한다.
    const missParam = missParameters(json);
    if(missParam) {
        return res.status(404).send('miss parameters : ' + missParam);
    }
    if(!req.body.category) {
        json.category = 'default';
    } else {
        json.category = req.body.category;
    }
    const exUser = await User.find({id: json.id, type: 'youtuber'});
    // 유튜버가 이미 등록되어 있다면 오류 처리
    if(exUser.length != 0) {
        return res.status(404).send('exist youtuber info');
    }
    // Youtube ID가 존재하는지 검사
    const checkId = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
        params: {
            key : APP_KEY,
            part: "id",
            id: json.id,
        }
    });
    if(checkId.data.items.length == 0) {
        return res.status(404).send('isn\'t correct youtuber id');
    }
    // 정보 생성 및 저장
    let user = new User({
        id: json.id,
        name: json.name,
        type: 'youtuber',
        category: json.category,
        createdAt: moment()
    });
    await user.save();
    return res.status(200).send('youtuber register success');
});

// 유튜버 정보 수정
router.put('/admin/:id', authUtil.validToken, async (req, res) => {
    let json = {};
    json.name = req.body.name;
    json.category = req.body.category;
    await User.updateOne({id: req.params.id}, json);
    return res.status(200).send('edit success');
});

// 유튜버 정보 삭제
router.delete('/admin/:id', authUtil.validToken, async (req, res) => {
    await User.deleteOne({id: req.params.id});
    return res.status(200).send('delete success');
});

module.exports = router;