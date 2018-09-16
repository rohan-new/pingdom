const express = require('express');
const Mongoclient = require('mongodb').MongoClient;
const request = require('request');
const bodyParser = require('body-parser'); 
const http = require('http');
const path = require('path');

const pathjoin = path.join(__dirname, '../public');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

Mongoclient.connect('mongodb://127.0.0.1:27017/Pingdom',{useNewUrlParser:true},(err,client)=>{
    if(err){
        console.log('Mongodb connection missing');
        throw err;   
    }
    console.log('Connected to the mongodb Server');
    const db =client.db('Pingdom');

    // db.collection('Pings-details').find({}).toArray().then(docs=>{
    //     console.log(docs);
    // });
     app.use(bodyParser.urlencoded({ extended: false }));
     const pathjoin = path.join(__dirname + '/public');
     const pathjoin1 = path.join(__dirname + '/public/error.html');
     const pathjoin2 = path.join(__dirname + '/public/success.html');
     const pathjoin3 = path.join(__dirname + '/public/monitor.html');



     app.use(express.static(pathjoin));

    //  app.get('/',(req,res)=>{
    //    res.sendFile('public/index.html' , { root : __dirname});
    //  });
    

   
    app.post('/web',(req,res)=>{

        var website = req.body.web;

        setInterval(()=>{
            request(website, function (error, response, body) {
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                if(response.statusCode != 200){
                    db.collection('Pings-details').findOne({'url':website}).then(docs=>{
                        if(docs == null ){
                            var d = new Date();
                            d =d.toISOString().replace('T', ' ').replace(/\..*$/, '');
                            db.collection('Pings-details').insert({'start_time':d,'url':website,'status_code':response.statusCode,'end_time':null},(err,result)=>{
                             if(err)throw err;
                             console.log(result);
                           }); 
                        }else{

                    db.collection('Pings-details').aggregate(
                        [
                            {$sort:{"url":1}},
                            {$group:{
                                _id:"$url",
                                lastentry:{$last:"$$ROOT"}
                             }},
                             {$match:{
                                 _id:website
                             }}
                        ]
                    ).toArray().then(docs=>{
                        var time = docs[0].lastentry.end_time;
                        if(time != null){
                            var d = new Date();
                            d =d.toISOString().replace('T', ' ').replace(/\..*$/, '');
                            db.collection('Pings-details').insert({'start_time':d,'url':website,'status_code':response.statusCode,'end_time':null},(err,result)=>{
                             if(err)throw err;
                           }); 

                        }
                    })
                }
                });
                   
                } else{
                    db.collection('Pings-details').findOne({'url':website}).then(docs=>{
                        if(docs == null){
                            res.sendFile(pathjoin2);
                            return;
                        }

                    db.collection('Pings-details').aggregate(
                        [
                            {$sort:{"url":1}},
                            {$group:{
                                _id:"$url",
                                lastentry:{$last:"$$ROOT"}
                             }},
                             {$match:{
                                 _id:website
                             }}
                        ]
                    ).toArray().then(docs=>{
                        if(docs == null){
                            return;
                        }
                        var time = docs[0].lastentry.end_time;
                        var id = docs[0].lastentry.id;
                        if(time == null){
                            var d = new Date();
                            d =d.toISOString().replace('T', ' ').replace(/\..*$/, '');
                            db.collection('Pings-details').update({_id:starttime},{$set:{"end_time":d}},(err,result)=>{
                             if(err)throw err;
                           }); 

                        }
                    });
                });




                }
            });
        },5000);        

    });

    app.get('/monitor',(req,res)=>{
        res.sendFile(pathjoin3);

    })
    app.post('/monitor',(req,res)=>{
    
        var website = req.body.web;
        db.collection('Pings-details').find({'url':website}).toArray().then(docs=>{
            console.log(docs);
            res.json(docs);
        });

    })
  

    app.listen(3000,()=>{
        console.log('Server running on Port 3000');
    });
})
