//Dependencies
const express = require('express'),
	bodyParser = require('body-parser'),
	multiparty = require('connect-multiparty'),
	mongodb = require('mongodb'),
	objectId = require('mongodb').ObjectId
	fs = require('fs');

const app = express();
const request = require('request');

//body-parser
app.use(bodyParser.urlencoded({ extended:true}));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function(req, res, next){
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
	res.setHeader("Access-Control-Allow-Headers", "content-type");
	res.setHeader("Access-Control-Allow-Credentials", true);
	next();
});

//Port
const port = 8080;
app.listen(port);

//Connection
const db = new mongodb.Db('db_star_wars',	new mongodb.Server('localhost', 27017, {}),	{});

app.get('/', function(req, res){
	res.status(200).send({
        title: "Node STAR WARS API",
        version: "0.0.1"
    });
});

//POST
app.post('/api', function(req, res){
	var dataPlanet;
	request({
		url: 'https://swapi.co/api/planets/?search='+req.body.nome,
		method: 'GET'
	  }, function(err, records, body) {
		 dataPlanet = {
			nome: req.body.nome,
			clima: req.body.clima,
			terreno: req.body.terreno,
			qtdFilmes : JSON.parse(body).results[0].films.length
		};
		db.open( function(err, mongoclient){
			mongoclient.collection('planetas', function(err, collection){
				collection.insert(dataPlanet, function(err, records){
					if(err){
						res.status(400).json({'status' : 'erro'});
					} else {
						res.status(201).json({
							'status' : 'Realizado com sucesso!',
							'Planet':dataPlanet
						});
					}
					mongoclient.close();
				});
			});
		});
	  });
	});

//GET
app.get('/api', function(req, res){
	db.open( function(err, mongoclient){
		mongoclient.collection('planetas', function(err, collection){
			collection.find().toArray(function(err, results){
				if(err){
					res.json(err);
				} else {
					res.json(results);
				}
				mongoclient.close();
			});
		});
	});
});

//GET NAME - ID
app.get('/api/search/:data', function(req, res){
	db.open( function(err, mongoclient){
		mongoclient.collection('planetas', function(err, collection){
			if(mongodb.ObjectID.isValid(req.params.data)){
				collection.find(objectId(req.params.data)).toArray(function(err, results){
					if(err){
						res.json(err);
					} else {
						if(results == ""){
							res.status(400).json({"info":"Nenhum resultado encontrado..."});
						}else{
							res.status(200).json(results);
						}
					}
				});
			}else{
				//let rg = new RegExp("^"+nome+"$", "i"); // Name must match
				let Rg = new RegExp(req.params.data, "i");
						collection.find({nome : Rg}).toArray(function(err, results){
							if(err){
								res.json(err);
							} else {
								if(results == ""){
									res.status(400).json({"info":"Nenhum resultado encontrado..."});
									
								}else{
									res.status(200).json(results);
								}
							}
						});	
			}
			mongoclient.close();
		});
	});
});

//DELETE ID
app.delete('/api/:id', function(req, res){
	db.open(function(err, mongoclient){
		mongoclient.collection('planetas', function(err, collection){
			if(mongodb.ObjectID.isValid(req.params.id)){
				collection.findOneAndDelete({_id : objectId(req.params.id)},function(err, records){
					if(err){
						res.status(400).json({'status' : err});
					} else {
						if(records.lastErrorObject.n != 0){
							res.status(201).json({
								'status' : 'Deletado com sucesso!',
								'info':records
							});
						}else{
							res.status(400).json({'status' : 'Dados não encontrado!'});
						}
					}
				});
			}else{
				res.status(400).json({"status":"ID invalido!"});
			}
			mongoclient.close();
		});
	});
});