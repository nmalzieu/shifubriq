var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var Slack = require('slack-node');

const token = 'xoxp-209661177494-208846908867-209002321940-4cba0f98e0ba5caffd9b81401ffc984f';
slack = new Slack(token);

const games = {}

const Briq = require('briq-api').Client;

const briq = new Briq({
  accessToken: 'IVGSeS7thwN1dWsJDhYTFXHjK6zLAKDGlVnqljLYe306DR45LqZ1hbs4uymKlcWt3MHuvmGQcUzGJQv6YLF3e862XMMg55CYKklXGHw06P3jBrHb0YkJtVg7XSfFgcEY',
  baseURL: 'https://briq-staging.herokuapp.com/v0',
});


app.use(bodyParser.urlencoded({ extended: false }))

app.post('/shifubriq', function(req, res) {
  if (req.body.channel_name !== 'directmessage') {
    res.send('This is not a private message');
  }
  const launcher = req.body.user_id;
  const channelId = req.body.channel_id;

  //slack.api('channels.info', data, function(err, response) {
  //  console.log(response);
  //});
  slack.api("im.list", function(err, response) {
    response.ims.forEach((im) => {
      let receiver;
      if (im.id === channelId) {
        receiver = im.user;
      }
      if (!receiver) {
        return;
      }

      const gameId = channelId;
      const userId = launcher;

      let launcherName;
      let receiverName;

      slack.api("users.list", function(err, response) {
        // console.log(err, response);
        response.members.forEach((member) => {
          if (member.id === launcher) {
            launcherName = member.name;
          }
          if (member.id === receiver) {
            receiverName = member.name;
          }
        });
        const game = games[gameId]
        if (!game) {
          const game = {
            gameId,
            userIds: [userId],
          }
          games[gameId] = game
          res.status(200).send();
          slack.api("chat.postMessage", { text: `${launcherName} just launched a shifubriq! ${receiverName}, join the game by typing /shifubriq`, channel: gameId }, function(err, response) {
            // console.log(err, response);
          });
          // slack..send({
          //   "text": `${launcherName} just launched a shifubriq! ${receiverName}, join the game by typing /shifubriq`,
          //   "response_type": "in_channel"
          // });
        } else {
          const { userIds } = game
          const nbUsers = userIds ? userIds.length : 0;
          switch (nbUsers) {
            case 1:
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
                      // as_user: false,
                      // response_type: "in_channel",
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
                    // res.status(200).send(postData);
                    slack.api("chat.postMessage", postData, function(err, response) {
                      console.log(err, response);
                    });
                }, 2000);
                res.status(200).send();
              }
              // throw
              break;
            default:
              // Nb of users >= 2, game is supposed to be started
              break;
          }
        }
      });

    });
  });
  // res.status(200).send('test');
})


const end = ({ gameId, winnerId, loserId, move, res }) => {
  // SEND MESSAGE TO WINNER : “YOU WIN”
  // SEND MESSAGE TO LOSER : “YOU LOST”
  // SEND 1 BQ FROM LOSER TO WINNER

  let winnerName;
  let loserName;
  console.log('end called');
  slack.api("users.list", function(err, response) {
    // console.log(err, response);
    response.members.forEach((member) => {
      if (member.id === winnerId) {
        winnerName = member.name;
      }
      if (member.id === loserId) {
        loserName = member.name;
      }
    });
    res.send(`${winnerName} wins the game 🤗🎉! ${loserName}, you lost 1 bq 😕`);
    games[gameId] = null;

    const transaction = {
      amount: 1,
      comment: "You win bro!!",
      app: 'shifubriq',
      from: loserName,
      to: winnerName
    };

    // users.map(user => ({
    //   amount,
    //   comment,
    //   app: 'give',
    //   from: req.body.user_name,
    //   to: user
    // }));
    briq.organization('Briq Hackathon #1').createTransaction(transaction);
  });

}


app.post('/action', function(req, res) {
  const payload = JSON.parse(req.body.payload);
  // console.log(req.body);
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
  console.log(moves);
  if (Object.keys(moves).length >= 2) {
    // Game ended, send results
    const { userIds } = games[gameId]
    const user1 = userIds[0]
    const user2 = userIds[1]
    const move1 = moves[user1]
    const move2 = moves[user2]
    console.log(1, move1, move2);
    if (move1 === move2) {
      // return tie
      res.send("It's a tie ! Play again ! 😂🤣🙃");
      games[gameId] = null;
    } else {
      if (move1 === "paper") {
        console.log(3);
        if (move2 === "rock") {
          console.log(4);
          //paper wins
          end({
            gameId,
            winnerId: user1,
            loserId: user2,
            move: "paper",
            res,
          })
        } else {
          console.log(5);
          if (move2 === "scissors") {
            console.log(6);
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
        console.log(7);
        if (move2 === "rock") {
          console.log(8);
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
            console.log(9);
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
        console.log(7);
        if (move2 === "scissors") {
          console.log(8);
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
            console.log(9);
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
    console.log(100)
    res.status(200).send();
  }
});

var server = app.listen(8081, function() {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
