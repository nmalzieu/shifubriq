const games = {}

const create = ({ userId, gameId }) => {
  const game = {
    gameId,
    userIds: [userId],
  }
  games.[gameId] = game
}

const launch = ({ userId, gameId }) => {
  const game = games[gameId]
  if (!game) {
    create({ userId, gameId })
  } else {
    const { users } = game
    const nbUsers = users.length
    switch (nbUsers) {
      case 0:
        // throw
        break;
      case 1:
        if (users[0] === userId) {
          // SEND MESSAGE “WAITING FOR THE OTHER”
        } else {
          // Start the game
          const newUsers = [...users, userId]
          games.[gameId].users = newUsers
          start(gameId)
        }
        // throw
        break;
      default:
        // Nb of users >= 2, game is supposed to be started
        break;
    }
  }
}

const start = (gameId) => {
  const game = games[gameId]
    // SEND MESSAGE WITH ACTION MESSAGE
}

const play = ({ userId, gameId, move }) => {
  const { moves } = games.[gameId]
  const newMoves = {...moves, [userId]: move }
  games.[gameId].moves = newMoves
  if (Object.keys(newMoves).length >= 2) {
    // Game ended, send results
    const { userIds } = games.[gameId]
    const user1 = userIds[0]
    const user2 = userIds[1]
    const move1 = newMoves[user1]
    const move2 = newMoves[user2]
    if (move1 === move2) {
      // return tie
      // SEND MESSAGE OF TIE
    } else if (move1 === “paper”) {
      if (move2 === “rock”) {
        //paper wins
        end({
          winnerId: user1,
          loserId: user2,
          move: “paper”,
        })
      } else {
        if (move2 === “scissors”) {
          //scissors wins
          end({
            winnerId: user2,
            loserId: user1,
            move: “scissors”,
          })
        }
      }
      if (move1 === “scissors”) {
        if (move2 === “rock”) {
          //rock wins
          end({
            winnerId: user2,
            loserId: user1,
            move: “rock”,
          })
        } else {
          if (move2 === “paper”) {
            //scissors wins
            end({
              winnerId: user1,
              loserId: user2,
              move: “scissors”,
            })

          }
        }
      }
    }
  }
}

const end = ({ winnerId, loserId, move }) => {
  // SEND MESSAGE TO WINNER : “YOU WIN”
  // SEND MESSAGE TO LOSER : “YOU LOST”
  // SEND 1 BQ FROM LOSER TO WINNER
}
