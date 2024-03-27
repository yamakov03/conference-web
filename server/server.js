const express = require('express');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
app.use(cors());
const port = 5000;
require('dotenv').config();


// Fill the appID and appCertificate key given by Agora.io
const appId = process.env.REACT_APP_AGORA_APP_ID;
const appCertificate = process.env.REACT_APP_AGORA_APP_CERTIFICATE;

app.get('/api/token', (req, res) => {
  const channelName = req.query.channelId;
  if (!channelName) {
    return res.status(400).send('Channel is required');
  }
  // Role could be RtcRole.PUBLISHER, RtcRole.SUBSCRIBER, RtcRole.ADMIN
  const role = RtcRole.PUBLISHER;

  // Privilege is valid for 24 hours
  const expirationTimeInSeconds = 3600 * 24;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Build the token
  const token = RtcTokenBuilder.buildTokenWithAccount(appId, appCertificate, channelName, 0, role, privilegeExpiredTs);
  
  return res.json({ token });
});


const mongoURI = process.env.MONGO_URI;

const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect().then(() => { console.log('Connected to MongoDB') }
  ).catch((err) => console.error(err));

const callUsersDB = client.db('callUsersDB');
const callUsersCollection = callUsersDB.collection('callUsersCollection');

app.post('/api/switch-camera', async (req, res) => {
  // add sender (selector) and receive (selected) pair to DB
  const senderUid = req.query.senderUid;
  const recipientUid = req.query.recipientUid;
  if (!senderUid) {
    return res.status(400).send('UID is required');
  }

  try {
    await callUsersCollection.updateOne({}, { $set: { [senderUid]: parseInt(recipientUid) } }, { upsert: true });
    return res.json({ message: `Switched camera for user ${senderUid}`, recipient: recipientUid});
  }
  catch (error) {
    return res.status(500).send('Error updating database');
  }
  
});

app.get('/api/check-switch-camera', async (req, res) => {
  // return
  try {
    const usersViewMap = await callUsersCollection.find({}).toArray();
    return res.json({ usersViewMap: usersViewMap });
  } catch (error) {
    console.error('Error checking switch camera:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/api/leave-call', async (req, res) => {
  let uid = req.query.uid;
  if (!uid) {
    return res.status(400).send('UID is required');
  }
  try {
    await callUsersCollection.updateOne({}, { $unset: { [uid]: '' } });
    return res.json({ message: `User ${uid} has left the call` });
  } catch (error) {
    console.error('Error leaving call:', error);
    return res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => console.log(`Token server listening on port ${port}!`));