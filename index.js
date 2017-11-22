async function getConfig(context) {
  return await context.config('bot-config.yml', {
    whitelist: []
  });
}

async function whiteListedUser(context) {
  const config = await getConfig(context);

  if (context.payload.comment.author_association === 'OWNER') {
    return true;
  }

  if (config.whitelist.users.includes(context.payload.comment.user.login)) {
    return true;
  }

  return false;
}

function parse(command) {
  const pattern = /(".*?"|[^"\s]+)(?=\s*|\s*$)/g;

  let match;
  let parsed = [];

  while (match = pattern.exec(command)) {
    parsed = [...parsed, match[0].replace(/"/g,'')];
  }
  return parsed;
}

module.exports = (robot) => {
  // Your code here
  console.log('Yay, the app was loaded!')

  // robot.on('issues.opened', async context => {
  //   console.log(context.github.issues);
  //   const config = await getConfig(context);

  //   context.github.issues.createComment(context.issue({body: 'test'}));
  // });

  robot.on('issue_comment', async context => {
    // console.log(context.payload);

    if (context.payload.comment.user.type === 'Bot') {
      return;
    }

    const tokens = parse(context.payload.comment.body);
    const [command, ...args] = tokens;

    console.log('command:', command, args);

    if (!await whiteListedUser(context)) {
      context.github.issues.createComment(context.issue({
        body: `Permission denied to execute command \`${command}\``
      }));
      return;
    }

    switch (command) {
      case '/label':
        console.log('labeling issue');
        const [operation, ...labels] = args;
        switch(operation) {
          case 'add':
            context.github.issues.addLabels(context.issue({labels}));
            break;
          case 'remove':
          const [name] = labels;
            context.github.issues.removeLabel(context.issue({name}));
            break;
          default:
            context.github.issues.createComment(context.issue({
              body: `Oh, snap! I couldn't understand your request.`
            }));
        }
        break;

      case '/close':
        console.log('closing issue');
        context.github.issues.edit(context.issue({
          state: 'closed'
        }));
        break;

      case '/open':
        console.log('opening issue');
        context.github.issues.edit(context.issue({
          state: 'open'
        }));
        break;
    }
  });
}
