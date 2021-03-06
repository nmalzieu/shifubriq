var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Slack = require('slack-node');
const { WebClient } = require('@slack/client');
import briq from './briq'

// Global
const token = process.env.SLACK_TOKEN;
const slack = new Slack(token);
const games = {}

// Utils
const getPlayersNameAndCallback = (firstId, secondId, cb) => {
  slack.api("users.list", function(err, response) {

    let firstName;
    let secondName;
    response.members.forEach((member) => {
      firstName = member.id === firstId ? member.name : firstName
      secondName = member.id === secondId ? member.name : secondName
    });
    cb(firstName, secondName)
  });
}

// APP LAUNCH
var server = app.listen(8080, function() {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
})
app.use(bodyParser.urlencoded({ extended: false }))


// API
app.post('/shifubriq', function(req, res) {
  const {
    channel_name: channelType,
    user_id: launcherId,
    channel_id: channelId,
  } = req.body

  if (channelType !== 'directmessage') {
    res.send('This is not a private message');
  }

  slack.api("im.list", { limit: 30000 }, function(err, response) {
    if (!response.ims) {
      console.log(3,response)
      return;
    }
    response.ims.forEach((im) => {
      console.log(1, im);
      let receiverId;
      if (im.id === channelId) {
        receiverId = im.user;
      }
      if (!receiverId) {
        return;
      }


      const gameId = channelId
      const userId = launcherId
      console.log(2, gameId, userId);
      if (!games[gameId]) {
        const cb = (launcherName, receiverName) => {
          const game = {
            gameId,
            userIds: [userId],
          }
          games[gameId] = game
          res.status(200).send();
          slack.api("chat.postMessage", {
            text: `${launcherName} just launched a shifubriq! ${receiverName}, join the game by typing /shifubriq`,
            channel: gameId
          }, (err, response) => {
            // console.log(err, response);
          });
        }
        getPlayersNameAndCallback(launcherId, receiverId, cb)
      } else {
        const { userIds } = games[gameId]
        const nbUsers = userIds ? userIds.length : 0;
        if (nbUsers === 1) {
          if (userIds[0] === userId) {
            res.status(200).send('Still waiting');
          } else {
            // Start the game
            const newUserIds = [...userIds, userId]
            games[gameId].userIds = newUserIds
            slack.api("chat.postMessage", {
                "text": "Shi…",
                channel: channelId
            });
            setTimeout(() => {
               slack.api("chat.postMessage", {
                   "text": "Fu…",
                   channel: channelId
               });
            }, 1000);
            setTimeout(() => {
                const postData = {
                  "text": "Briq!",
                  channel: channelId,
                  attachments: JSON.stringify([{
                    "text": "What's your move?",
                    "fallback": "You are unable to choose a game",
                    "callback_id": "wopr_game",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [{
                      "name": "game",
                      "text": "✊",
                      "type": "button",
                      "value": "rock"
                    }, {
                      "name": "game",
                      "text": "✋",
                      "type": "button",
                      "value": "paper"
                    }, {
                      "name": "game",
                      "text": "✌️",
                      "type": "button",
                      "value": "scissors"
                    }]
                  }])
                };
                slack.api("chat.postMessage", postData, function(err, response) {
                  console.log(err, response);
                });
            }, 2000);
            res.status(200).send();
          }
        }
      }
    });
  });
  // res.status(200).send('test');
})

app.post('/action', function(req, res) {
  const payload = JSON.parse(req.body.payload);

  const action = payload.actions[0];
  const userId = payload.user.id;
  const gameId = payload.channel.id;
  if (action.name !== 'game') {
    return;
  }
  const move = action.value;
  const moves = games[gameId].moves || {};
  moves[userId] = move;
  games[gameId].moves = moves;

  if (Object.keys(moves).length >= 2) {
    // Game ended, send results
    const { userIds } = games[gameId]
    const user1 = userIds[0]
    const user2 = userIds[1]
    const move1 = moves[user1]
    const move2 = moves[user2]
    if (move1 === move2) {
      // return tie
      res.send("It's a tie ! Play again ! 😂🤣🙃");
      games[gameId] = null;
    } else {
      if (move1 === "paper") {
        if (move2 === "rock") {
          //paper wins
          end({
            gameId,
            winnerId: user1,
            loserId: user2,
            move: "paper",
            res,
          })
        } else {
          if (move2 === "scissors") {
            //scissors wins
            end({
              gameId,
              winnerId: user2,
              loserId: user1,
              move: "scissors",
              res,
            })
          }
        }
      }
      if (move1 === "scissors") {
        if (move2 === "rock") {
          //rock wins
          end({
            gameId,
            winnerId: user2,
            loserId: user1,
            move: "rock",
            res,
          })
        } else {
          if (move2 === "paper") {
            //scissors wins
            end({
              gameId,
              winnerId: user1,
              loserId: user2,
              move: "scissors",
              res,
            })

          }
        }
      }

      if (move1 === "rock") {
        if (move2 === "scissors") {
          //rock wins
          end({
            gameId,
            winnerId: user1,
            loserId: user2,
            move: "rock",
            res,
          })
        } else {
          if (move2 === "paper") {
            //scissors wins
            end({
              gameId,
              winnerId: user2,
              loserId: user1,
              move: "paper",
              res,
            })

          }
        }
      }
    }
  } else if (Object.keys(moves).length === 1) {
    res.status(200).send();
  }
});

app.get('/oauth', async function(req, res) {
  const { code } = req.query;
  const {
    user_id: userId,
    team_id: teamId,
    team_name: teamName,
    access_token,
  } = await new WebClient().oauth.access(
    process.env.SLACK_CLIENT_ID,
    process.env.SLACK_CLIENT_SECRET,
    code,
  );
  res.status(200).send(access_token);

})

const end = ({ gameId, winnerId, loserId, move, res }) => {
  const cb = (winnerName, loserName) => {
    res.send(`${winnerName} wins the game 🤗🎉! ${loserName}, you lost 1 bq 😕`);

    slack.api("team.info", function(err, response) {

      const organizationName = response.team.name
      games[gameId] = null;
      const transaction = {
        amount: 1,
        comment: "You win bro!!",
        app: 'shifubriq',
        from: loserName,
        to: winnerName
      };
      briq.organization(organizationName).createTransaction(transaction);

    });
  }

  getPlayersNameAndCallback(winnerId, loserId, cb)
}
