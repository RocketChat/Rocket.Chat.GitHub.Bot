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

  if (config.whitelist.includes(context.payload.comment.user.login)) {
    return true;
  }

  return false;
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

    const tokens = context.payload.comment.body.split(' ');
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
        context.github.issues.edit(context.issue({
          labels: args
        }));
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
