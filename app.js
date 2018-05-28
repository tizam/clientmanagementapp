const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const exphbs = require('express-handlebars');
const mongoose = require('mongoose');
require('./models/client');

const app = express();

// method override
app.use(methodOverride('_method'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
 
// parse application/json
app.use(bodyParser.json());

// session
app.use(session({
  secret: 'anonnoob',
  resave: false,
  saveUninitialized: true
}));

// connect flash
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  next();
});


// monggose
mongoose.connect('mongodb://localhost:27017/climanapp');

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('mongodb connection established');
});

const Client = mongoose.model('client');


// static folder
app.use(express.static('public'));

// handlebars view engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');


// routes
app.get('/about', (req, res) => {
  res.render('about');
});

app.get('/', (req, res) => {
  const clients = Client.find({}).then((clients) => {
    res.render('home', {clients:clients});
  });
});

// add client page
app.get('/client/add', (req, res) => {
  res.render('clients/add');
});

// post client info 
app.post('/clients', (req, res) => {
  let errors = [];
  if(!req.body.name) {
    errors.push({text: 'Name is required'});
  }
  if(!req.body.address) {
    errors.push({text: 'Address is required'});
  }
  if(!req.body.email) {
    errors.push({text: 'Email is required'});
  }
  if(!req.body.phone) {
    errors.push({text: 'Phone is required'});
  }
  if(!req.body.activity) {
    errors.push({text: 'Activity is required'});
  }
  if(errors.length > 0){
    return res.render('client/add', {
      errors: errors,
      name: req.body.name,      
      address: req.body.address,
      email: req.body.email,
      phone: req.body.phone,
      activity: req.body.activity
    });
  }
  const client = new Client({
    name: req.body.name,
    address: req.body.address,
    email: req.body.email,
    phone: req.body.phone,
    activity: req.body.activity
  });
  client.save().then(() => {
    req.flash('success_msg', 'Client Added');
    res.redirect('/');
  }).catch((e) => console.log(e));
});

//edit client  view
app.get('/client/edit/:id', (req, res) => {
  Client.findById({_id: req.params.id})
    .then((c) => {
      const client = {
        id: c._id,
        name: c.name,
        address: c.address,
        email: c.email,
        phone: c.phone,
        activity: c.activity
      };
      res.render('clients/edit', {client: client});
    }).catch((e) => console.log(e));
});

app.put('/client/:id', (req, res) => {
  Client.findOne({
    _id: req.params.id
  })
  .then((client) => {
    client.name = req.body.name;
    client.address = req.body.address;
    client.email = req.body.email;
    client.phone = req.body.phone;
    client.activity = req.body.activity;

    client.save()
      .then((client) => {
        req.flash('success_msg', 'Client Updated');
        res.redirect('/');
      }).catch((e) => console.log(e));
  }).catch((e) => {
    console.log(e);
  }) 
});

// delete client
app.delete('/client/:id', (req, res) => {
  Client.deleteOne({
    _id: req.params.id
  }).then((result) => {
    req.flash('success_msg', 'Client Deleted');
    res.redirect('/');
  }).then((e) => console.log(e));
});

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`server started at port ${port}`);
});