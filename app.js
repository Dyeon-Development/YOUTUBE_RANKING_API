'use strict';

const express = require('express');
const app = express();
const Channel = require('./models/channel');
const Video = require('./models/video');
const axios = require('axios');
const connect = require('./models');
const cron = require('node-cron');
const backup = require('mongodb-backup-fixed');
const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
require('dotenv').config();
connect();
const route = require('./routes');

let response;
let i, j, res_id, res_data, k;
let dummy_ids = "UCwx6n_4OcLgzAGdty0RWCoA,UC7Krez5EI8pXKHnYWsE-zUw,UCIG4gr_wIy5CIlcFciUbIQw";
let video_ids = "";
let channel_list = [];
let weekly_viewCount = 0;
let weekly_likeCount = 0;
let weekly_dislikeCount = 0;
let weekly_commentCount = 0;
let first_index = 0;
let second_index = 0;
let third_index = 0;
let fourth_index = 0;
let video_list = [];

const {
    BACKUP_ID,
    BACKUP_PASSWORD,
} = process.env;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: false }));
app.use('/', route);

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});

cron.schedule('0 0 * * *', async function(){
    // 이전 데이터 tar로 백업
    /*
    backup({
        uri: `mongodb://${BACKUP_ID}:${BACKUP_PASSWORD}@211.63.192.209:27017/youtube`,
        root: __dirname,
        tar: moment().format('YYYY-MM-DD hh:mm:ss')+'.tar'
    });
    // 현재 데이터들을 다 비움
    await Channel.remove({});
    await Video.remove({});
    */
    // 채널 정보 저장
    response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
    params: {
        key : "AIzaSyARexz4Agdty6pDyuQuQnuLLwOCvI0tCw0",
        part: "id,snippet,statistics",
        id: dummy_ids,
    }
    });
    for(i = 0 ; i < response.data.items.length ; i++) {
        let channel = new Channel({
            id: response.data.items[i].id,
            channel_name: response.data.items[i].snippet.title,
            img: response.data.items[i].snippet.thumbnails.default.url,
            viewCount: response.data.items[i].statistics.viewCount,
            subCount: response.data.items[i].statistics.subscriberCount,
            videoCount: response.data.items[i].statistics.videoCount,
            publishedAt: response.data.items[i].snippet.publishedAt,
            createdAt: moment(),
            category: 'default',
        });
        await channel.save();
    }
    // 각 채널에 해당하는 동영상 정보 조회 및 저장
    channel_list = await Channel.find({createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
    // 동영상 id 조회
    for(i = 0 ; i < channel_list.length ; i++) {
        video_ids = "";
        res_id = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                key : "AIzaSyARexz4Agdty6pDyuQuQnuLLwOCvI0tCw0",
                part: "id",
                channelId: channel_list[i].id,
                publishedAfter: "2020-01-20T00:00:00.000Z",
                type: "video",
                order: "date",
                maxResults: "50",
            }
        });
        // 동영상 id string화
        for(j = 0 ; j < res_id.data.items.length ; j++) {
            video_ids += res_id.data.items[j].id.videoId;
            if(j != (res_id.data.items.length - 1))
                video_ids += ",";
        }
        
        // 동영상 상세 정보 조회
        res_data = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
            params: {
                key : "AIzaSyARexz4Agdty6pDyuQuQnuLLwOCvI0tCw0",
                part: "id,snippet,statistics",
                id: video_ids,
            }
        });
        // 동영상 상세 정보 저장
        for(k = 0 ; k < res_data.data.items.length ; k++) {
            let video = new Video({
                id: res_data.data.items[k].id,
                channel: channel_list[i]._id,
                video_name: res_data.data.items[k].snippet.title,
                img: res_data.data.items[k].snippet.thumbnails.default.url,
                viewCount: res_data.data.items[k].statistics.viewCount,
                likeCount: res_data.data.items[k].statistics.likeCount,
                dislikeCount: res_data.data.items[k].statistics.dislikeCount,
                commentCount: res_data.data.items[k].statistics.commentCount,
                publishedAt: res_data.data.items[k].snippet.publishedAt,
                createdAt: moment(),
            });
            await video.save();
        }
    }
    for(i = 0 ; i < channel_list.length ; i++) {
        video_list = await Video.find({channel: channel_list[i]._id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}});
        video_list.sort((a,b) => (a.viewCount > b.viewCount) ? -1 : ( (b.viewCount > a.viewCount) ? 1 : 0));
        for(j = 0 ; j < video_list.length ; j++) {
            weekly_viewCount += video_list[i].viewCount;
            weekly_likeCount += video_list[i].likeCount;
            weekly_dislikeCount += video_list[i].dislikeCount;
            weekly_commentCount += video_list[i].commentCount;
        }
        VF_index = weekly_viewCount / video_list.length + video_list[0].viewCount;
        VE_index = (weekly_likeCount / (weekly_likeCount + weekly_dislikeCount)) * 100;
        VC_index = (weekly_commentCount / channel_list[i].subCount) * 100;
        BC_index = VF_index + ((0.04 * weekly_viewCount) * VE_index / 100)+((0.005 * weekly_viewCount) * VC_index / 100);
        await Channel.updateOne({ id: channel_list[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
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
    channel_list.sort((a,b) => (a.VF_index > b.VF_index) ? -1 : ( (b.VF_index > a.VF_index) ? 1 : 0));
    for(i = 0 ; i < channel_list.length ; i++) {
        await Channel.updateOne({ id: channel_list[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VF_rank: i+1,
        });
    }
    channel_list.sort((a,b) => (a.VE_index > b.VE_index) ? -1 : ( (b.VE_index > a.VE_index) ? 1 : 0));
    for(i = 0 ; i < channel_list.length ; i++) {
        await Channel.updateOne({ id: channel_list[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VE_rank: i+1,
        });
    }
    channel_list.sort((a,b) => (a.VC_index > b.VC_index) ? -1 : ( (b.VC_index > a.VC_index) ? 1 : 0));
    for(i = 0 ; i < channel_list.length ; i++) {
        await Channel.updateOne({ id: channel_list[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            VC_rank: i+1,
        });
    }
    channel_list.sort((a,b) => (a.BC_index > b.BC_index) ? -1 : ( (b.BC_index > a.BC_index) ? 1 : 0));
    for(i = 0 ; i < channel_list.length ; i++) {
        await Channel.updateOne({ id: channel_list[i].id, createdAt: {"$gte": moment().format('YYYY-MM-DD')}}, { 
            BC_rank: i+1,
        });
    }
});

module.exports = app;