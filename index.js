async function getConfig(context) {
	return await context.config('bot-config.yml', {
		bot: {
			name: '@bot'
		},
		whitelist: {
			users: [],
			labels: []
		}
	});
}

async function isWhiteListedLabel(label, context) {
	const config = await getConfig(context);

	return !!config.whitelist.labels.find((e) => {
		return e.toUpperCase() === label.toUpperCase();
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
		parsed = [...parsed, match[0].replace(/"/g, '')];
	}
	return parsed;
}

module.exports = (robot) => {
	console.log('Yay, the app was loaded!');

	// robot.on('issues.opened', async context => {
	//   console.log(context.github.issues);
	//   const config = await getConfig(context);

	//   context.github.issues.createComment(context.issue({body: 'test'}));
	// });

	robot.on('issue_comment', async context => {

    //do nothing if the comment is deleted
    if (context.payload.action === 'delete') {
      return;
    }
    //do not accept commands from other bots
		if (context.payload.comment.user.type === 'Bot') {
			return;
		}

    const config = await getConfig(context);

		const issues = context.github.issues;
		const tokens = parse(context.payload.comment.body);
		const [bot, command, ...args] = tokens;

		const errors = {
			unknow: () => {
				issues.createComment(context.issue({
					body: 'Oh, snap! I couldn\'t understand your request.'
				}));
			},
			command: (command) => {
				issues.createComment(context.issue({
					body: `You don't have permission to execute this command \`${ command }\``
				}));
			},
			label: (label) => {
				issues.createComment(context.issue({
					body: `You don't have permission to use this label \`${ label }\``
				}));
			}
		};

		console.log('command:', bot, command, args);

		if (config.bot.name.toLowerCase() !== bot.toLowerCase()) {
      //probably a mention
      // errors.unknow();
      return;
		}

		if (!await whiteListedUser(context)) {
			errors.command(command);
			return;
		}

		switch (command) {
			case 'label':
				console.log('labeling issue');
				const [operation, ...labels] = args;
				const [label] = labels;

				//change this if multiple labels commands become necessary
				if (!await isWhiteListedLabel(label, context)) {
					errors.label(label);
				} else {
          switch (operation) {
          	case 'add':
          		issues.addLabels(context.issue({labels:[label]}));
          		break;
          	case 'remove':
          		issues.removeLabel(context.issue({name:label}));
          		break;
          	default:
          		errors.unknow();
          }
        }
				break;

			case 'close':
				console.log('closing issue');
				issues.edit(context.issue({
					state: 'closed'
				}));
				break;

			case 'open':
				console.log('opening issue');
				issues.edit(context.issue({
					state: 'open'
				}));
				break;
		}
	});
};
