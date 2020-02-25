'use strict';

const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
const Channel = require('./models/channel');
const Video = require('./models/video');
const User = require('./models/user');
const axios = require('axios');
const connect = require('./models');
const cron = require('node-cron');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
require('dotenv').config();
connect();
const route = require('./routes');
const APP_KEY = process.env.APP_KEY;

// CORS issue를 해결하기 위해 허용 (react에서 막힘)
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    res.header("Access-Control-Allow-Headers", "token, Authorization, Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', route);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

// 매일 자정 업데이트 함수 실행
cron.schedule('0 0 * * *', async function(){
    // 필요한 변수들을 미리 정의하지 않으면 app engine으로 deploy 시 오류 발생
    let channel_params, video_params;
    let i, j, k;
    let channel_id = [];
    let video_id = [];
    let sub_video_id = [];
    let res_channel_info, res_video_id, res_video_info;
    let list_channel = [];
    let list_video = [];
    let weekly_viewCount = 0;
    let weekly_likeCount = 0;
    let weekly_dislikeCount = 0;
    let weekly_commentCount = 0;
    let VF_index = 0;
    let VE_index = 0;
    let VC_index = 0;
    let BC_index = 0;
    let channel_list_VF = [];
    let channel_list_VE = [];
    let channel_list_VC = [];
    let channel_list_BC = [];
    let nextToken = undefined;

    // User collection에 존재하는 모든 유튜버들을 불러와서 String 화 시킨다.
    channel_id = await User.find({type: 'youtuber'});
    for(i = 0 ; i < channel_id.length ; i++)
        list_channel[i] = channel_id[i].id;
    channel_id = list_channel.join(',');

    // 유튜버 채널 정보 저장
    channel_params = {
        key : APP_KEY,
        part: "id,snippet,statistics",
        id: channel_id,
        maxResults: "50",
    };
    do {
        if(nextToken)
        channel_params.pageToken = nextToken;
        res_channel_info = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
            params: channel_params
        });
        nextToken = res_channel_info.data.nextPageToken;
        for(i = 0 ; i < res_channel_info.data.items.length ; i++) {
            let category = await User.findOne({id: res_channel_info.data.items[i].id})
            let channel = new Channel({
                id: res_channel_info.data.items[i].id,
                channel_name: res_channel_info.data.items[i].snippet.title,
                img: res_channel_info.data.items[i].snippet.thumbnails.default.url,
                viewCount: res_channel_info.data.items[i].statistics.viewCount,
                subCount: res_channel_info.data.items[i].statistics.subscriberCount,
                videoCount: res_channel_info.data.items[i].statistics.videoCount,
                publishedAt: res_channel_info.data.items[i].snippet.publishedAt,
                createdAt: moment(),
                country: res_channel_info.data.items[i].snippet.country,
                category: category.category,
            });
            await channel.save();
        }
    } while(nextToken)
    nextToken = undefined;

    // 각 채널에 해당하는 동영상 정보 조회 및 저장
    list_channel = await Channel.find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}});

    // 동영상 id 조회 (현재 시점부터 7일 전 까지)
    for(i = 0 ; i < list_channel.length ; i++) {
        video_id = [];
        video_params = {
            key : APP_KEY,
            part: "id",
            channelId: list_channel[i].id,
            publishedAfter: moment().add("-7","d")._d,
            type: "video",
            order: "date",
            maxResults: "50",
        };
        do {
            if(nextToken)
            video_params.pageToken = nextToken;
            res_video_id = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: video_params
            });
            nextToken = res_video_id.data.nextPageToken;
            for(j = 0 ; j < res_video_id.data.items.length ; j++)
            video_id.push(res_video_id.data.items[j].id.videoId);
        } while(nextToken)
        j = 0;

        // 동영상 상세 정보 조회
        do {
            sub_video_id = video_id.slice((50 * j), (50 * (j+1)));
            j++;
            res_video_info = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    key : APP_KEY,
                    part: "id,snippet,statistics,contentDetails",
                    id: sub_video_id.join(','),
                }
            });

            // 동영상 상세 정보 저장
            for(k = 0 ; k < res_video_info.data.items.length ; k++) {
                let video = new Video({
                    id: res_video_info.data.items[k].id,
                    channel: list_channel[i]._id,
                    video_name: res_video_info.data.items[k].snippet.title,
                    description: res_video_info.data.items[k].snippet.description,
                    img: res_video_info.data.items[k].snippet.thumbnails.default.url,
                    viewCount: res_video_info.data.items[k].statistics.viewCount,
                    likeCount: res_video_info.data.items[k].statistics.likeCount,
                    dislikeCount: res_video_info.data.items[k].statistics.dislikeCount,
                    commentCount: res_video_info.data.items[k].statistics.commentCount,
                    length: res_video_info.data.items[k].contentDetails.duration,
                    category: res_video_info.data.items[k].snippet.categoryId,
                    publishedAt: res_video_info.data.items[k].snippet.publishedAt,
                    createdAt: moment(),
                });
                await video.save();
            }
        } while(Math.ceil(video_id.length / 50) > j)
    }

    for(i = 0 ; i < list_channel.length ; i++) {
        list_video = await Video.find({channel: list_channel[i]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
        // 비디오 존재하지 않을 시, 전부 0 으로 처리
        if(list_video.length === 0) {
            weekly_viewCount = 0;
            weekly_likeCount = 0;
            weekly_dislikeCount = 0;
            weekly_commentCount = 0;
        } else {
            // viewCount 기준으로 내림차순
            list_video.sort((a,b) => (a.viewCount > b.viewCount) ? -1 : ( (b.viewCount > a.viewCount) ? 1 : 0));
            for(j = 0 ; j < list_video.length ; j++) {
                if(list_video[j].viewCount)
                    weekly_viewCount += list_video[j].viewCount;
                if(list_video[j].likeCount)
                    weekly_likeCount += list_video[j].likeCount;
                if(list_video[j].dislikeCount)
                    weekly_dislikeCount += list_video[j].dislikeCount;
                if(list_video[j].commentCount)
                    weekly_commentCount += list_video[j].commentCount;
            }
        }
        // 비디오 존재하지 않을 시, 전부 0 으로 처리
        if(list_video.length === 0)
        {
            VF_index = 0;
            VE_index = 0;
            VC_index = 0;
            BC_index = 0;
        }
        else
        {
            VF_index = weekly_viewCount / list_video.length + list_video[0].viewCount;
            // 분모가 0 일 경우 0으로 처리
            if((weekly_likeCount + weekly_dislikeCount) == 0)
                VE_index = 0;
            else
                VE_index = (weekly_likeCount / (weekly_likeCount + weekly_dislikeCount)) * 100;
            // 분모가 0 일 경우 0으로 처리
            if(list_channel[i].subCount == 0)
                VC_index = 0;
            else
                VC_index = (weekly_commentCount / list_channel[i].subCount) * 100;
            BC_index = VF_index + ((0.04 * weekly_viewCount) * VE_index / 100)+((0.005 * weekly_viewCount) * VC_index / 100);
        }
        await Channel.updateOne({ id: list_channel[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VF_index: VF_index,
            VE_index: VE_index,
            VC_index: VC_index,
            BC_index: BC_index
        });
        weekly_viewCount = 0;
        weekly_likeCount = 0;
        weekly_dislikeCount = 0;
        weekly_commentCount = 0;
    }
    channel_list_VF = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['VF_index', 'descending']]);
    for(i = 0 ; i < channel_list_VF.length ; i++) {
        await Channel.updateOne({ id: channel_list_VF[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VF_rank: i+1,
        });
    }
    channel_list_VE = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['VE_index', 'descending']]);
    for(i = 0 ; i < channel_list_VE.length ; i++) {
        await Channel.updateOne({ id: channel_list_VE[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VE_rank: i+1,
        });
    }
    channel_list_VC = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['VC_index', 'descending']]);
    for(i = 0 ; i < channel_list_VC.length ; i++) {
        await Channel.updateOne({ id: channel_list_VC[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VC_rank: i+1,
        });
    }
    channel_list_BC = await Channel
    .find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}})
    .sort([['BC_index', 'descending']]);
    for(i = 0 ; i < channel_list_BC.length ; i++) {
        await Channel.updateOne({ id: channel_list_BC[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            BC_rank: i+1,
        });
    }
});

module.exports = app;