/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

const expect = require('chai').expect;
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {

  app.route('/api/books')
  
    .get(function (req, res){
      //response will be array of book objects
      //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        const db = client.db('library');
        if(err) {
          console.log(`Database err: ${err}`);
        } else {
          console.log(`Successful database connection`);
          db.collection('library').find({}).toArray((err, books) => {
            if(err) return res.json(`could not find entries: ${err}`);
            const bookArray = books.map(entry => {
              let book = {
                _id: entry._id,
                title: entry.book_title,
                commentcount: entry.num_of_comments
              }
              return book;
            })
            res.json(bookArray);
          })
        }
      })  
  })
    
    .post(function (req, res){
      if(!req.body.title) return res.json("please submit a title");
      const book = {
        book_title: req.body.title,
        num_of_comments: 0,
        comments: []
      }
      //response will contain new book object including atleast _id and title
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        const db = client.db('library');
        if(err) {
          console.log(`Database err: ${err}`);
        } else {
          console.log('Successful database connection');
          db.collection('library').insertOne(book, (err, doc) => {
            if(err) res.json(`could not update: ${err}`);
            const entry = {_id: doc.insertedId, title: book.book_title}
            res.json(entry);
          })
        }
      })
    })
    
    .delete(function(req, res){
      //if successful response will be 'complete delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        const db = client.db('library');
        if(err) {
          console.log(`Database err: ${err}`);
        } else {
          console.log('Successful database connection');
          db.collection('library').deleteMany({}, (err, data) => {
            if(err) res.json(`could not delete: ${err}`);
            res.json('complete delete successful');
          })
        }
      })
    })
  


  app.route('/api/books/:id')
    .get(function (req, res){
      const bookId = req.params.id;
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        const db = client.db('library');
        if(err) {
          console.log(`Database err: ${err}`);
        } else {
          console.log('Successful database connection');
          db.collection('library').find({_id: new ObjectId(bookId)}).toArray((err, data) => {
            if(err) res.json(`could not find ${bookId} ${err}`);
            if(data[0]) {
              const book = {
                _id: data[0]._id,
                title: data[0].book_title,
                comments: data[0].comments
              }; 
              res.json(book);
            } else {
              console.log(bookId);
              res.json(`no book exists`);
            }
          })
        }
      })
    })
    
    .post(function(req, res){
      const bookId = req.params.id;
      const comment = req.body.comment;
      //json res format same as .get
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        const db = client.db('library');
        if(err) {
          console.log(`Database err: ${err}`);
        } else {
          console.log('Successful database connection');
          db.collection('library').findAndModify(
            {_id: new ObjectId(bookId)},
            {},
            {$inc: { num_of_comments : 1 }, $push: {comments: comment}},
            { new:true, upsert: false },
            (err, data) => {
            if(err) res.json(`could not update ${bookId} ${err}`);
            const book = {
                _id: data.value._id,
                title: data.value.book_title,
                comments: data.value.comments
              }; 
            res.json(book);
          })
        }
      })
    })
    
    .delete(function(req, res){
      const bookId = req.params.id;
      //if successful response will be 'delete successful'
      MongoClient.connect(MONGODB_CONNECTION_STRING, (err, client) => {
        const db = client.db('library');
        if(err) {
          console.log(`Database err: ${err}`);
        } else {
          console.log('Successful database connection');
          db.collection('library').findOneAndDelete({_id:new ObjectId(bookId)}, (err, doc) => {
            if(err) {
              res.send(`could not delete ${bookId} ${err}`);
            } else {
              doc.value ? res.json(`delete successful`) : res.json(`no book exists`);
            }
          })
        }
      })
    });
  
};
