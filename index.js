
const { Client, GatewayIntentBits, Intents, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, InteractionType, AttachmentBuilder, PermissionsBitField, Events, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { renderBoard } = require('./utils/renderBoard');
const { checkWinner } = require('./utils/checkWinner');
const questions = require('./questions.json');
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage } = require("canvas");
const db = require("pro.db");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});
let isAnyGameRunning = false;
const REQUIRED_ROLE_ID = db.get('host');

const games = new Map();

client.once('ready', () => console.log(`✅ Logged in as ${client.user.tag}`));


client.on('messageDelete', async (message) => {
  if (!message.guild || !message.channel || !message.author) return;

  const game = games.get(message.channel.id);
  if (game && message.author.id === client.user.id) {
    games.delete(message.channel.id);
    isAnyGameRunning = false;
    await message.channel.send('🛑 تم حذف رسالة من رسائل اللعبة لذا تم الغاء اللعبة.');
  }
});
client.on('messageDelete', async (message) => {
  if (!message.guild || !message.channel || !message.author) return;

  if (raceGame && raceGame.channel.id === message.channel.id && message.author.id === client.user.id) {
    raceGame = null;
    isAnyGameRunning = false;
    await message.channel.send('🛑 تم حذف رسالة من رسائل اللعبة لذا تم الغاء اللعبة.');
  }
});

client.on('messageCreate', async (message) => {
const member = message.member;
  if (message.author.bot) return;

  if (message.content === '!العاب') {
if (!member.roles.cache.has(REQUIRED_ROLE_ID)) {
  return message.react('❌');
}
    const gamesEmbed = new EmbedBuilder()
      .setTitle('قائمة الألعاب 🎮')
      .setColor('#00b0f4')
      .setDescription('استخدم أحد الأوامر التالية لبدء لعبة:')
      .addFields(
        { name: '!خلية', value: '-# لعبة فرق تتنافس على بناء طريق عبر خلية مليئة بالحروف', inline: false },
        { name: '!سباق', value: '-# لعبة سباق فرق على خريطة، من يصل للنهاية أولاً يفوز', inline: false },
        { name: '!تكتاك', value: '-# XO بنظام افرقه تحديات حجرة ورقة مقص مدموجه مع', inline: false },
        { name: '!مسار (قيد الصيانة)', value: '-# لعبة جديدة قيد التطوير، ترقبوا قريباً!', inline: false },
      )

    await message.channel.send({ embeds: [gamesEmbed] });
  }
});

client.on('messageCreate', async message => {
  if (!message.guild || message.author.bot) return;
  const { channel, content, member } = message;

 if (content === '!خلية') {
const member = message.member;
if (!member.roles.cache.has(REQUIRED_ROLE_ID)) {
  return message.react('❌');
}
if (isAnyGameRunning) return message.channel.send('❗ هناك لعبة قيد التشغيل.');

  isAnyGameRunning = true;

  if (games.has(channel.id)) return channel.send('❗ هناك لعبة قيد التشغيل.');

  const gameData = {
    phase: 'join',
    players: [],
    teamA: [],
    teamB: [],
    leaderA: null,
    leaderB: null,
    nextLeader: null,
    board: [
      ['ع','ك','ي','و','ح'],
      ['ش','ن','ب','ج','م'],
      ['ت','ل','ق','غ','خ'],
      ['أ','ز','ض','ف','ر'],
      ['س','هـ','ص','ط','د']
    ],
    owner: Array.from({ length: 5 }, () => Array(5).fill(null)),
    usedLetters: [],
    messages: [],
    joinTimeout: true 
  };

  games.set(channel.id, gameData);

  setTimeout(() => {
    const game = games.get(channel.id);
    if (game && game.phase === 'join' && game.players.length < 4) {
      games.delete(channel.id);
isAnyGameRunning = false;
      channel.send('⏱ لم ينضم عدد كافٍ من اللاعبين خلال 30 ثانية. تم إلغاء اللعبة.');
    }
  }, 30000);

 const descriptionText = `__طريقة اللعب:__
**1-** هي لعبة جماعية تُلعب على لوحة ثابتة مكونة من خلايا، وكل خلية فيها حرف معين.

**2-** ينقسم اللاعبون إلى فريقين (فريق أخضر وفريق أحمر)، ويتم اختيار قائد لكل فريق عن طريق تصويت أعضاء الفريق
القائد هو المتحكم الكامل بإختيار الحرف للفريق عليك اختيار الشخص الموثوق به.

**3-** يبدأ اللعب باختيار حرف من الخلية، تُعتبر الاحرف المختاره هي اول حرف من إجابة السؤال ادناه.
بعد ذلك تُطرح أسئلة، وعلى الفريقين محاولة الإجابة. الفريق الذي يجيب بشكل صحيح يعطي قائده حق اختيار الحرف التالي.
الهدف من اللعبة:

**4-** الفريق الأخضر يحاول صنع طريق عمودي متصل من الأعلى إلى الأسفل عبر الحروف التي يكسبها.
الفريق الأحمر يحاول صنع طريق أفقي متصل من اليمين إلى اليسار.


الفريق الذي يكوّن الطريق المطلوب أولاً هو الفائز.

**المشاركين (0/20):**`;
  const joinRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('joinGame').setLabel('🔹 انضمام').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('beginGame').setLabel('🚀 بدء اللعبة').setStyle(ButtonStyle.Primary)
  );

  await channel.send({
    embeds: [new EmbedBuilder().setTitle('خلية الحروف 🎮').setDescription(descriptionText).setFooter({ text: 'اضغط انضمام للانضمام، ثم انظر المسؤول يبدأ اللعبة.' }).setColor("#0aa0e6").setTimestamp()],
    components: [joinRow]
  });
}
});
function generateLetterButtons(game) {
  const rows = [];

  for (let i = 0; i < game.board.length; i++) {
    const actionRow = new ActionRowBuilder();
    for (let j = 0; j < game.board[i].length; j++) {
      const letter = game.board[i][j];
      const owner = game.owner[i][j];
      
      const button = new ButtonBuilder()
        .setCustomId(`letter_${i}_${j}`)
        .setLabel(letter)
        .setStyle(owner === 'A' ? ButtonStyle.Success : owner === 'B' ? ButtonStyle.Danger : ButtonStyle.Primary)
        .setDisabled(!!owner); // إذا فيه مالك للحرف، يتقفل الزر

      actionRow.addComponents(button);
    }
    rows.push(actionRow);
  }

  return rows;
}
client.on('interactionCreate', async interaction => {
const descriptionText = `__طريقة اللعب:__
**1-** هي لعبة جماعية تُلعب على لوحة ثابتة مكونة من خلايا، وكل خلية فيها حرف معين.

**2-** ينقسم اللاعبون إلى فريقين (فريق أخضر وفريق أحمر)، ويتم اختيار قائد لكل فريق عن طريق تصويت أعضاء الفريق
القائد هو المتحكم الكامل بإختيار الحرف للفريق عليك اختيار الشخص الموثوق به.

**3-** يبدأ اللعب باختيار حرف من الخلية، تُعتبر الاحرف المختاره هي اول حرف من إجابة السؤال ادناه.
بعد ذلك تُطرح أسئلة، وعلى الفريقين محاولة الإجابة. الفريق الذي يجيب بشكل صحيح يعطي قائده حق اختيار الحرف التالي.
الهدف من اللعبة:

**4-** الفريق الأخضر يحاول صنع طريق عمودي متصل من الأعلى إلى الأسفل عبر الحروف التي يكسبها.
الفريق الأحمر يحاول صنع طريق أفقي متصل من اليمين إلى اليسار.


الفريق الذي يكوّن الطريق المطلوب أولاً هو الفائز.`;
  if (interaction.type !== InteractionType.MessageComponent) return;
  const game = games.get(interaction.channel.id);
  if (!game) return;
  const { customId, user, member } = interaction;

  if (game.phase === 'join') {
    if (customId === 'joinGame') {
  if (!game.players.includes(user.id)) {
    game.players.push(user.id);
    await interaction.reply({ content: '✅ انضممت للعبة!', ephemeral: true });

    const joinedMentions = game.players.map(id => `<@${id}>`).join('\n');
    const updatedEmbed = new EmbedBuilder()
      .setTitle('خلية الحروف 🎮')
      .setDescription(`${descriptionText}\n\n**المشاركين (${game.players.length}/20):**\n${joinedMentions}\n\nاضغط انضمام للانضمام، ثم انظر المسؤول يبدأ اللعبة.`)
      .setFooter({ text: 'اضغط انضمام للانضمام، ثم انظر المسؤول يبدأ اللعبة.' })
.setColor("#0aa0e6").setTimestamp();
    const message = await interaction.message.fetch();
    await message.edit({ embeds: [updatedEmbed] });
  } else {
    await interaction.reply({ content: '❗ أنت منضم مسبقًا.', ephemeral: true });
  }
} else if (customId === 'beginGame') {
      if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
    return interaction.reply({ content: '🚫 لا تملك صلاحية بدء اللعبة.', ephemeral: true });
  }

      if (game.players.length < 4)
        return interaction.reply({ content: '❗ تحتاج 4 لاعبين على الأقل.', ephemeral: true });

      const shuffled = game.players.sort(() => Math.random() - 0.5);
      game.teamA = shuffled.filter((_, i) => i % 2 === 0);
      game.teamB = shuffled.filter((_, i) => i % 2 !== 0);
      game.phase = 'voteLeader';

      const teamAUsernames = await Promise.all(game.teamA.map(async id => {
        const member = await interaction.guild.members.fetch(id);
       return `<@${member.user.id}>`;
}));
     const teamBUsernames = await Promise.all(game.teamB.map(async id => {
  const member = await interaction.guild.members.fetch(id);
  return `<@${member.user.id}>`;
}));
///

      const teamAUsernamesv = await Promise.all(game.teamA.map(async id => {
        const member = await interaction.guild.members.fetch(id);
       return member.user.displayName;
}));
     const teamBUsernamesv = await Promise.all(game.teamB.map(async id => {
  const member = await interaction.guild.members.fetch(id);
  return member.user.displayName;
}));

      const embedA = new EmbedBuilder().setTitle('🟩 الفريق الأخضر').setDescription(`${teamAUsernames.join('\n')}`);
      const embedB = new EmbedBuilder().setTitle('🟥 الفريق الأحمر').setDescription(`${teamBUsernames.join('\n')}`);
      await interaction.update({ embeds: [embedA, embedB], components: [] });

      const votesA = new Map();
const votesB = new Map();
const voteCountsA = {};
const voteCountsB = {};

const rowA = new ActionRowBuilder();
for (let i = 0; i < game.teamA.length; i++) {
  const id = game.teamA[i];
  const username = teamAUsernamesv[i];
  voteCountsA[id] = 0;
  rowA.addComponents(new ButtonBuilder().setCustomId(`voteA_${id}`).setLabel(`${username} (0)`).setStyle(ButtonStyle.Secondary));
}
const msgA = await interaction.channel.send({ content: '🟩 صوّت لقائد الفريق الأخضر', components: [rowA] });

const rowB = new ActionRowBuilder();
for (let i = 0; i < game.teamB.length; i++) {
  const id = game.teamB[i];
  const username = teamBUsernamesv[i];
  voteCountsB[id] = 0;
  rowB.addComponents(new ButtonBuilder().setCustomId(`voteB_${id}`).setLabel(`${username} (0)`).setStyle(ButtonStyle.Secondary));
}
const msgB = await interaction.channel.send({ content: '🟥 صوّت لقائد الفريق الأحمر', components: [rowB] });

const colA = msgA.createMessageComponentCollector({ time: 30000 });
const colB = msgB.createMessageComponentCollector({ time: 30000 });

colA.on('collect', async btn => {
  if (!game.teamA.includes(btn.user.id)) {
    return btn.reply({ content: '❌ لا يمكنك التصويت لهذا الفريق.', ephemeral: true });
  }

  if (votesA.has(btn.user.id)) {
    await btn.deferUpdate();
    return;
  }

  const [, id] = btn.customId.split('_');
  votesA.set(btn.user.id, id);

  voteCountsA[id]++;
  const updatedRow = new ActionRowBuilder();
  for (let i = 0; i < game.teamA.length; i++) {
    const uid = game.teamA[i];
    const uname = teamAUsernamesv[i];
    updatedRow.addComponents(
      new ButtonBuilder().setCustomId(`voteA_${uid}`).setLabel(`${uname} (${voteCountsA[uid]})`).setStyle(ButtonStyle.Secondary)
    );
  }
  await msgA.edit({ components: [updatedRow] });

  await btn.reply({ ephemeral: true, content: '✅ تم التصويت' });
});

colB.on('collect', async btn => {
  if (!game.teamB.includes(btn.user.id)) {
    return btn.reply({ content: '❌ لا يمكنك التصويت لهذا الفريق.', ephemeral: true });
  }

  if (votesB.has(btn.user.id)) {
    await btn.deferUpdate();
    return;
  }

  const [, id] = btn.customId.split('_');
  votesB.set(btn.user.id, id);

  voteCountsB[id]++;
  const updatedRow = new ActionRowBuilder();
  for (let i = 0; i < game.teamB.length; i++) {
    const uid = game.teamB[i];
    const uname = teamBUsernamesv[i];
    updatedRow.addComponents(
      new ButtonBuilder().setCustomId(`voteB_${uid}`).setLabel(`${uname} (${voteCountsB[uid]})`).setStyle(ButtonStyle.Secondary)
    );
  }
  await msgB.edit({ components: [updatedRow] });

  await btn.reply({ ephemeral: true, content: '✅ تم التصويت' });
});
let endedA = false, endedB = false;

colA.on('end', () => {
  endedA = true;
  tryFinishVoting();
});
colB.on('end', () => {
  endedB = true;
  tryFinishVoting();
});
function getMajority(votes) {
  const count = {};
  for (const vote of votes.values()) {
    count[vote] = (count[vote] || 0) + 1;
  }
  const entries = Object.entries(count);
  const maxVotes = Math.max(...entries.map(([_, v]) => v));
  const topCandidates = entries.filter(([_, v]) => v === maxVotes).map(([k]) => k);

  const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];
  return chosen;
}

async function tryFinishVoting() {
  if (!endedA || !endedB) return;

if (votesA.size === 0 || votesB.size === 0) {
    games.delete(interaction.channel.id); 
    await interaction.channel.send('❌ لم يتم التصويت لأي قائد. تم إلغاء اللعبة.');
 isAnyGameRunning = false;
    return;
  }
          const leaderA = getMajority(votesA);
const leaderB = getMajority(votesB);
game.leaderA = leaderA;
game.leaderB = leaderB;
game.phase = 'play';

await interaction.channel.send(`✅ قادة الفرق: الأخضر <@${interaction.guild.members.cache.get(leaderA)?.user.id}>, الأحمر <@${interaction.guild.members.cache.get(leaderB)?.user.id}>`);

let available = [];
for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) available.push({ x, y });
const rand = available[Math.floor(Math.random() * available.length)];
const letter = game.board[rand.y][rand.x];
const pos = { x: rand.x, y: rand.y };

const qarr = questions[letter] || [];
if (!qarr.length) return interaction.channel.send('❌ لا توجد أسئلة لهذا الحرف.');

const question = qarr[Math.floor(Math.random() * qarr.length)];
await interaction.channel.send({
  embeds: [new EmbedBuilder().setTitle(`❓ السؤال على الحرف العشوائي: ${letter}`).setDescription(question.question)]
});

const col = interaction.channel.createMessageCollector({ time: 120000 });
col.on('collect', msg => {
  if (msg.author.bot) return;
  if (msg.content.trim().startsWith(question.answer)) {
    const team = game.teamA.includes(msg.author.id) ? 'green' : game.teamB.includes(msg.author.id) ? 'red' : null;
    if (!team) return;
    game.owner[pos.y][pos.x] = team;
    game.nextLeader = team === 'green' ? game.leaderA : game.leaderB;
    col.stop('ok');
    msg.react('✅');
  }
});

 col.on('end', async (_, reason) => {
            if (reason !== 'ok') return interaction.channel.send('⏱ انتهى الوقت');
            const buffer = await renderBoard(game.board, game.owner);
            await interaction.channel.send({ files: [new AttachmentBuilder(buffer, { name: 'board.png' })] });
            const win = checkWinner(game.owner);
            if (win) {
              await interaction.channel.send(`🎉 فريق ${win === 'green' ? 'الأخضر' : 'الأحمر'} فاز!`);
              games.delete(interaction.channel.id);
 isAnyGameRunning = false;
            } else {
              const rows = [];
              game.board.flat().forEach((ltr, i) => {
                if (i % 5 === 0) rows.push(new ActionRowBuilder());
                const y = Math.floor(i / 5);
                const x = i % 5;
                const owner = game.owner[y][x];
                const style = owner === 'green' ? ButtonStyle.Success : owner === 'red' ? ButtonStyle.Danger : ButtonStyle.Primary;
                const disabled = !!owner;
                rows[rows.length - 1].addComponents(
                  new ButtonBuilder().setCustomId(`choose_${ltr}`).setLabel(ltr).setStyle(style).setDisabled(disabled)
                );
              });
    const msg =               await interaction.channel.send({ content: `✅ <@${interaction.guild.members.cache.get(game.nextLeader)?.user.id}> فقط يمكنك اختيار الحرف التالي`, components: rows });


    game.letterPicked = false;
    game.letterMessage = msg;

    setTimeout(async () => {
      const stillGame = games.get(interaction.channel.id);
      if (!stillGame || stillGame.letterPicked) return;

      const team = stillGame.nextLeader === stillGame.leaderA ? 'teamA' : 'teamB';
      const newCandidates = stillGame[team].filter(id => id !== stillGame.nextLeader);

      if (newCandidates.length === 0) {
        await interaction.channel.send(`❌ لا يوجد لاعبين يمكن تعيينهم كقائد جديد لفريق ${team === 'teamA' ? 'الأخضر' : 'الأحمر'}.`);
        return;
      }

      const newLeader = newCandidates[Math.floor(Math.random() * newCandidates.length)];
      stillGame.nextLeader = newLeader;
      stillGame[team === 'teamA' ? 'leaderA' : 'leaderB'] = newLeader;

      await interaction.channel.send(`⏱ القائد السابق لم يختر حرفًا خلال 30 ثانية. تم تعيين <@${interaction.guild.members.cache.get(newLeader)?.user.id}> كقائد جديد.`);
const rows = [];
              game.board.flat().forEach((ltr, i) => {
                if (i % 5 === 0) rows.push(new ActionRowBuilder());
                const y = Math.floor(i / 5);
                const x = i % 5;
                const owner = game.owner[y][x];
                const style = owner === 'green' ? ButtonStyle.Success : owner === 'red' ? ButtonStyle.Danger : ButtonStyle.Primary;
                const disabled = !!owner;
                rows[rows.length - 1].addComponents(
                  new ButtonBuilder().setCustomId(`choose_${ltr}`).setLabel(ltr).setStyle(style).setDisabled(disabled)
                );
              });
      await stillGame.letterMessage.edit({content: `✅ <@${interaction.guild.members.cache.get(game.nextLeader)?.user.id}> فقط يمكنك اختيار الحرف التالي`, components: rows });

      stillGame.letterPicked = false;

    }, 30000);
  }
});
        }
      }
  }

  if (game.phase === 'play' && customId.startsWith('choose_')) {
    if (user.id !== game.nextLeader)
      return interaction.reply({ content: '❌ ليس من دورك.', ephemeral: true });

    const letter = customId.replace('choose_', '');
    let pos;
    outer: for (let y = 0; y < 5; y++)
      for (let x = 0; x < 5; x++)
        if (game.board[y][x] === letter) { pos = { x, y }; break outer; }

    if (!pos)
      return interaction.reply({ content: '❌ حرف غير موجود.', ephemeral: true });

    if (game.owner[pos.y][pos.x])
      return interaction.reply({ content: '❗ هذا الحرف تم اختياره مسبقًا.', ephemeral: true });

    game.letterPicked = true;

    const qarr = questions[letter] || [];
    if (!qarr.length)
      return interaction.reply({ content: '❌ لا توجد أسئلة لهذا الحرف.', ephemeral: true });

    const question = qarr[Math.floor(Math.random() * qarr.length)];
    await interaction.channel.send({ embeds: [new EmbedBuilder().setTitle(`❓ السؤال على الحرف: ${letter}`).setDescription(question.question)] });

    const col = interaction.channel.createMessageCollector({ time: 30000 });
    col.on('collect', msg => {
      if (msg.author.bot) return;
      if (msg.content.trim().startsWith(question.answer)) {
        const team = game.teamA.includes(msg.author.id) ? 'green' : game.teamB.includes(msg.author.id) ? 'red' : null;
        if (!team) return;
        game.owner[pos.y][pos.x] = team;
        game.nextLeader = team === 'green' ? game.leaderA : game.leaderB;
        col.stop('ok');
        msg.react('✅');
      }
    });

    col.on('end', async (_, reason) => {
      if (reason !== 'ok') return interaction.channel.send('⏱ انتهى الوقت، لم يتم حل السؤال.');
      const buffer = await renderBoard(game.board, game.owner);
      await interaction.channel.send({ files: [new AttachmentBuilder(buffer, { name: 'board.png' })] });

      const win = checkWinner(game.owner);
      if (win) {
        await interaction.channel.send(`🎉 فريق ${win === 'green' ? 'الأخضر' : 'الأحمر'} فاز!`);
        games.delete(interaction.channel.id);
 isAnyGameRunning = false;
      } else {
        const rows = [];
              game.board.flat().forEach((ltr, i) => {
                if (i % 5 === 0) rows.push(new ActionRowBuilder());
                const y = Math.floor(i / 5);
                const x = i % 5;
                const owner = game.owner[y][x];
                const style = owner === 'green' ? ButtonStyle.Success : owner === 'red' ? ButtonStyle.Danger : ButtonStyle.Primary;
                const disabled = !!owner;
                rows[rows.length - 1].addComponents(
                  new ButtonBuilder().setCustomId(`choose_${ltr}`).setLabel(ltr).setStyle(style).setDisabled(disabled)
                );
              });
        const msg = await interaction.channel.send({content: `✅ <@${interaction.guild.members.cache.get(game.nextLeader)?.user.id}> فقط يمكنك اختيار الحرف التالي`, components: rows });

game.letterPicked = false; 

setTimeout(async () => {
  const stillGame = games.get(interaction.channel.id);
  if (!stillGame || stillGame.letterPicked) return;

  const team = stillGame.nextLeader === stillGame.leaderA ? 'teamA' : 'teamB';
  const newCandidates = stillGame[team].filter(id => id !== stillGame.nextLeader);

  if (newCandidates.length === 0) {
    await interaction.channel.send(`❌ لا يوجد لاعبين يمكن تعيينهم كقائد جديد لفريق ${team === 'teamA' ? 'الأخضر' : 'الأحمر'}.`);
    return;
  }

  const newLeader = newCandidates[Math.floor(Math.random() * newCandidates.length)];
  stillGame.nextLeader = newLeader;
  stillGame[team === 'teamA' ? 'leaderA' : 'leaderB'] = newLeader;

  await interaction.channel.send(`⏱ القائد السابق لم يختر حرفًا. تم اختيار قائد جديد عشوائيًا: <${interaction.guild.members.cache.get(newLeader)?.user.id}>`);

const rows = [];
              game.board.flat().forEach((ltr, i) => {
                if (i % 5 === 0) rows.push(new ActionRowBuilder());
                const y = Math.floor(i / 5);
                const x = i % 5;
                const owner = game.owner[y][x];
                const style = owner === 'green' ? ButtonStyle.Success : owner === 'red' ? ButtonStyle.Danger : ButtonStyle.Primary;
                const disabled = !!owner;
                rows[rows.length - 1].addComponents(
                  new ButtonBuilder().setCustomId(`choose_${ltr}`).setLabel(ltr).setStyle(style).setDisabled(disabled)
                );
              });
  const newMsg = await interaction.channel.send({content: `✅ <${interaction.guild.members.cache.get(game.nextLeader)?.user.id}> فقط يمكنك اختيار الحرف التالي`, components: rows });

  stillGame.messages.push(newMsg.id);
}, 60000);

      }
    });
  }
});
/////////////////

let players = [];
let teamX = [];
let teamO = [];
let gameStarted = false;
let board = Array(9).fill(null);
let currentX = 0;
let currentO = 0;
let currentPlayers = {};
let gameMessage;
const activeGameMessages = new Set();

client.on("messageCreate", async (message) => {
  if (message.content === "!تكتاك") {
const member = message.member;

if (!member.roles.cache.has(REQUIRED_ROLE_ID)) {
  return message.react('❌');
}
if (isAnyGameRunning) return message.channel.send('❗ هناك لعبة قيد التشغيل.');

  isAnyGameRunning = true;

    if (gameStarted || activeGameMessages.size > 0) return message.reply("🔁 هناك لعبة بالفعل قيد التشغيل.");

    players = [];
    teamX = [];
    teamO = [];
    board = Array(9).fill(null);

    const joinRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("join_game").setLabel("🔹 انضمام").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("start_game").setLabel("🚀 بدء اللعبة ").setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setTitle("تكتاك 🎮")
      .setDescription(`__طريقة اللعب:___

**1-** اللعبة عبارة عن تيمين X ، O

**2-** اللعبة دمج بين XO وحجرة ورقة مقص.
كل خانة من خانات XO (١ إلى ٩) تمثل تحدي "حجرة ورقة مقص".

**3-** يبدا اللعبة بجولة حجرة ورقة مقص بين شخص من كل فريق
الفائز يحتل الخانة بشعار فريقه (X أو O).
إذا تعادلا (نفس الاختيار)، تظل الخانة مفتوحة.

**4-** الهدف مثل XO العادي: أول فريق يصنع ثلاث خانات متصلة أفقياً أو عمودياً أو قطرياً يفوز!

المشاركين :
العدد الحالي: 0/20`)
.setFooter({ text: 'اضغط انضمام للانضمام، ثم انظر المسؤول يبدأ اللعبة.' })
      .setColor("Blue")	.setTimestamp();


    gameMessage = await message.channel.send({ embeds: [embed], components: [joinRow] });
    activeGameMessages.add(gameMessage.id);

    const collector = gameMessage.createMessageComponentCollector({ time: 30000 });
    collector.on("end", () => {
      if (!gameStarted && players.length < 4) {
        message.channel.send("⏱ لم ينضم عدد كافٍ من اللاعبين خلال 30 ثانية.");
        endGame(message.channel);
      }
    });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  if (!gameMessage) return;

  if (interaction.customId === "join_game") {
    if (players.includes(interaction.user.id)) {
      return interaction.reply({ content: "❗ أنت بالفعل منضم.", ephemeral: true });
    }
    if (players.length >= 20) {
      return interaction.reply({ content: "❗ الحد الأقصى للاعبين هو 20.", ephemeral: true });
    }
    players.push(interaction.user.id);
    const embed = new EmbedBuilder()
      .setTitle("تكتاك 🎮")
      .setDescription(`__طريقة اللعب:___

**1-** اللعبة عبارة عن تيمين X ، O

**2-** اللعبة دمج بين XO وحجرة ورقة مقص.
كل خانة من خانات XO (١ إلى ٩) تمثل تحدي "حجرة ورقة مقص".

**3-** يبدا اللعبة بجولة حجرة ورقة مقص بين شخص من كل فريق
الفائز يحتل الخانة بشعار فريقه (X أو O).
إذا تعادلا (نفس الاختيار)، تظل الخانة مفتوحة.

**4-** الهدف مثل XO العادي: أول فريق يصنع ثلاث خانات متصلة أفقياً أو عمودياً أو قطرياً يفوز!

المشاركين:\n ${players.map(id => `<@${id}>`).join("\n")}\nالعدد الحالي: ${players.length}/20`)
      .setColor("Blue");
    await gameMessage.edit({ embeds: [embed] });
    await interaction.reply({ content: `✅ انضممت بنجاح.`, ephemeral: true });
  }

  if (interaction.customId === "cancel_game") {
    endGame(interaction.channel, "🚫 تم إلغاء اللعبة.");
    return interaction.reply({ content: "🚫 تم إلغاء اللعبة.", ephemeral: false });
  }

  if (interaction.customId === "start_game") {
 
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
    return interaction.reply({ content: '🚫 لا تملك صلاحية بدء اللعبة.', ephemeral: true });
  }
    if (players.length < 4) {
      return interaction.reply({ content: "🔻 الحد الأدنى هو 4 لاعبين.", ephemeral: true });
    }

    gameStarted = true;
    shuffle(players);
    teamX = players.filter((_, i) => i % 2 === 0);
    teamO = players.filter((_, i) => i % 2 !== 0);
const embedd = new EmbedBuilder()
    .setTitle("👥 الفرق")
.addFields(
		{ name: 'فريق ❌', value: `${teamX.map(id => `<@${id}>`).join("\n")}`, inline: true },
		{ name: 'فريق ⭕️', value: `${teamO.map(id => `<@${id}>`).join("\n")}`, inline: true },
	)
    .setColor("Purple");
    await interaction.channel.send({content:`✅ تم بدء اللعبة!`, embeds: [embedd]});

    if (gameMessage) await gameMessage.edit({ components: disableAllButtons(gameMessage.components) });

    currentPlayers = {
      x: teamX[currentX],
      o: teamO[currentO]
    };

    await playRound(interaction.channel);
  }
});

function endGame(channel, reason = "❌ تم إنهاء اللعبة.") {
  gameStarted = false;
  players = [];
  teamX = [];
  teamO = [];
  board = Array(9).fill(null);
  currentX = 0;
  currentO = 0;
  currentPlayers = {};
  if (gameMessage) gameMessage.edit({ components: disableAllButtons(gameMessage.components) }).catch(() => {});
  gameMessage = null;
  activeGameMessages.clear();
  channel.send(reason);
  isAnyGameRunning = false; 
}

function disableAllButtons(rows) {
  return rows.map(row => new ActionRowBuilder().addComponents(
    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
  ));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

async function playRound(channel) {
  if (!gameStarted) return;
  const playerX = currentPlayers.x;
  const playerO = currentPlayers.o;

  const embed = new EmbedBuilder()
    .setTitle("🆚 جولة جديدة")
    .setDescription(`<@${playerX}> ❌ ضد ⭕️ <@${playerO}>\nاختاروا خياركم خلال 15 ثانية!`)
    .setColor("Purple");

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("rps_rock").setLabel("✊").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("rps_paper").setLabel("🖐").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("rps_scissors").setLabel("✌").setStyle(ButtonStyle.Secondary)
  );

  const msg = await channel.send({ content: `<@${playerX}> 🆚 <@${playerO}>`, embeds: [embed], components: [row] });
  activeGameMessages.add(msg.id);

  const rpsChoices = new Map();
  const filter = i => [playerX, playerO].includes(i.user.id);
  const collector = msg.createMessageComponentCollector({ filter, time: 15000 });

  collector.on("collect", async i => {
    if (!rpsChoices.has(i.user.id)) {
      rpsChoices.set(i.user.id, i.customId.split("_")[1]);
      await i.reply({ content: `✅ اخترت: ${i.customId.split("_")[1]}`, ephemeral: true });
    }
  });

  collector.on("end", async () => {
  if (!gameStarted) return;
  if (rpsChoices.size < 2) {
    await channel.send("🔁 أحد اللاعبين لم يختار، سيتم اختيار لاعبين جدد للجولة التالية.");

    currentX = (currentX + 1) % teamX.length;
    currentO = (currentO + 1) % teamO.length;
    currentPlayers = {
      x: teamX[currentX],
      o: teamO[currentO]
    };
    return playRound(channel);
  }

  const choiceX = rpsChoices.get(playerX);
  const choiceO = rpsChoices.get(playerO);
  const result = getRPSWinner(choiceX, choiceO);

  if (result === "draw") {
    const userX = await channel.guild.members.fetch(playerX);
    const userO = await channel.guild.members.fetch(playerO);
    const drawBuffer = await generateRPSResultImage(userX.user, userO.user, choiceX, choiceO);

    await channel.send({
      content: "⚔️ تعادل بين اللاعبين! سيتم اختيار لاعبين جدد.",
      files: [{ attachment: drawBuffer, name: "draw_result.png" }]
    });

    currentX = (currentX + 1) % teamX.length;
    currentO = (currentO + 1) % teamO.length;
    currentPlayers = {
      x: teamX[currentX],
      o: teamO[currentO]
    };
    return playRound(channel);
  }

    const winnerId = result === "x" ? playerX : playerO;
    const loserId = result === "x" ? playerO : playerX;

    const winnerUser = await channel.guild.members.fetch(winnerId);
    const loserUser = await channel.guild.members.fetch(loserId);

    const rpsBuffer = await generateRPSResultImage(winnerUser.user, loserUser.user, rpsChoices.get(winnerId), rpsChoices.get(loserId));

    await channel.send({
      content: `🎉 <@${winnerId}> فاز بالجولة!`,
      files: [{ attachment: rpsBuffer, name: "rps_result.png" }]
    });

    await promptXOPlacement(channel, winnerId, result === "x" ? "❌" : "⭕️");
  });
}

function getRPSWinner(a, b) {
  if (a === b) return "draw";
  if ((a === "rock" && b === "scissors") || (a === "paper" && b === "rock") || (a === "scissors" && b === "paper")) return "x";
  return "o";
}

async function promptXOPlacement(channel, playerId, symbol) {
  if (!gameStarted) return;

  const available = board.map((v, i) => v === null ? i : null).filter(v => v !== null);
  const buttons = board.map((v, i) => {
  const button = new ButtonBuilder()
    .setCustomId(`xo_${i}`)
    .setLabel(v === null ? (i + 1).toString() : v)
    .setStyle(v === "❌" ? ButtonStyle.Danger : v === "⭕️" ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(v !== null);
  return button;
});
  const rows = [];
for (let i = 0; i < buttons.length; i += 3) {
  const group = buttons.slice(i, i + 3);
  if (group.length > 0) {
    rows.push(new ActionRowBuilder().addComponents(group));
  }
}


  const canvasBuffer = await generateBoardImage();

  const msg = await channel.send({
    content: `<@${playerId}> اختر موقع ${symbol} على اللوحة:`,
    files: [{ attachment: canvasBuffer, name: "board.png" }],
    components: rows
  });

  activeGameMessages.add(msg.id);

  const collector = msg.createMessageComponentCollector({
    filter: i => i.user.id === playerId,
    time: 30000
  });

  collector.on("collect", async i => {
    const index = parseInt(i.customId.split("_")[1]);
    if (board[index] !== null) {
      return i.reply({ content: "❌ هذه الخانة ممتلئة.", ephemeral: true });
    }

    board[index] = symbol;
    await i.update({
      components: msg.components.map(row =>
        new ActionRowBuilder().addComponents(
          row.components.map(button => {
            const isClicked = button.data.custom_id === `xo_${index}`;
            return ButtonBuilder.from(button)
              .setLabel(isClicked ? symbol : button.label)
              .setStyle(isClicked ? (symbol === "❌" ? ButtonStyle.Danger : ButtonStyle.Primary) : ButtonStyle.Secondary)
              .setDisabled(true);
          })
        )
      )
    });

    const winner = checkWin();
    if (winner) {
  const finalBoardImage = await generateBoardImage();
  const winningTeam = winner === "❌" ? teamX : teamO;
  await channel.send({
    content: `🏆 الفريق الفائز هو ${winner}!
${winningTeam.map(id => `<@${id}>`).join(" ")}`,
    files: [{ attachment: finalBoardImage, name: "final_board.png" }]
  });
  endGame(channel); // 👈 هذا يحل المشكلة
  return;
}


    currentX = (currentX + 1) % teamX.length;
    currentO = (currentO + 1) % teamO.length;
    currentPlayers = {
      x: teamX[currentX],
      o: teamO[currentO]
    };
    return playRound(channel);
  });

  collector.on("end", async collected => {
    if (collected.size === 0) {
      await channel.send(`⏰ <@${playerId}> لم يقم باختيار موقع خلال المهلة، الجولة راحت عليه!`);

      currentX = (currentX + 1) % teamX.length;
      currentO = (currentO + 1) % teamO.length;
      currentPlayers = {
        x: teamX[currentX],
        o: teamO[currentO]
      };
      return playRound(channel);
    }
  });
}


function checkWin() {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  return null;
}

async function generateBoardImage() {
  const canvas = createCanvas(300, 300);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFF";
  ctx.fillRect(0, 0, 300, 300);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 5;

  ctx.beginPath();
  ctx.moveTo(100, 0);
  ctx.lineTo(100, 300);
  ctx.moveTo(200, 0);
  ctx.lineTo(200, 300);
  ctx.moveTo(0, 100);
  ctx.lineTo(300, 100);
  ctx.moveTo(0, 200);
  ctx.lineTo(300, 200);
  ctx.stroke();

  ctx.font = "20px Arial";
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  board.forEach((v, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = col * 100 + 50;
    const y = row * 100 + 50;

    if (v === "❌") {
      ctx.beginPath();
      ctx.moveTo(x - 40, y - 40);
      ctx.lineTo(x + 40, y + 40);
      ctx.moveTo(x + 40, y - 40);
      ctx.lineTo(x - 40, y + 40);
      ctx.strokeStyle = "#FF0000";
      ctx.stroke();
    } else if (v === "⭕️") {
      ctx.beginPath();
      ctx.arc(x, y, 40, 0, Math.PI * 2);
      ctx.strokeStyle = "#0000FF";
      ctx.stroke();
    } else {
      ctx.fillText((i + 1).toString(), x, y);
    }
  });

  return canvas.toBuffer();
}

async function generateRPSResultImage(user1, user2, choice1, choice2) {
  const canvas = createCanvas(550, 366);
  const ctx = canvas.getContext("2d");
  const bg = await loadImage(path.join(__dirname, "RPSBG"));

  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  const avatar1 = await loadImage(user1.displayAvatarURL({ extension: "png", size: 128 }));
  const avatar2 = await loadImage(user2.displayAvatarURL({ extension: "png", size: 128 }));

  ctx.save();
  ctx.beginPath(); ctx.arc(85, 65, 35, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  ctx.drawImage(avatar1, 50, 30, 70, 70);
  ctx.restore();

  ctx.save();
  ctx.beginPath(); ctx.arc(455, 65, 35, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
  ctx.drawImage(avatar2, 420, 30, 70, 70);
  ctx.restore();

  const choicesMap = {
    rock: "rock.png",
    paper: "wark.png",
    scissors: "mks.png"
  };

  const choiceImage1 = await loadImage(path.join(__dirname, choicesMap[choice1]));
  const choiceImage2 = await loadImage(path.join(__dirname, choicesMap[choice2]));

  ctx.drawImage(choiceImage1, 60, 110, 50, 50);   
  ctx.drawImage(choiceImage2, 430, 110, 50, 50);  

  return canvas.toBuffer();
}

// ----------- بداية لعبة مسار الفرق -----------
let raceGame = null;

client.on("messageCreate", async message => {
const member = message.member;
  if (message.content === "!مسار") {
if (!member.roles.cache.has("")) {
  return message.react('❌');
}
if (isAnyGameRunning) return message.channel.send('❗ هناك لعبة قيد التشغيل.');

  isAnyGameRunning = true;

    if (raceGame) return message.reply("🚫 هناك مسار جاري حاليًا!");

    raceGame = {
      players: [],
      teams: { red: [], blue: [] },
      positions: { red: 0, blue: 0 },
      turn: "red",
      currentPlayers: { red: null, blue: null },
      channel: message.channel
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("join_race").setLabel("🏁 انضم للمسار").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("start_race").setLabel("🚀 بدء المسار").setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ content: `🎯 مسار الفرق بدأ! اضغط للانضمام.`, components: [row] });
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const userId = interaction.user.id;
  if (interaction.customId === "join_race") {
    if (!raceGame || raceGame.players.includes(userId)) {
      return interaction.reply({ content: "❗ أنت بالفعل منضم أو لا يوجد مسار!", ephemeral: true });
    }
    raceGame.players.push(userId);
    return interaction.reply({ content: `✅ انضممت للمسار!`, ephemeral: true });
  }

  if (interaction.customId === "start_race") {
    if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
    return interaction.reply({ content: '🚫 لا تملك صلاحية بدء اللعبة.', ephemeral: true });
  }
    if (!raceGame || raceGame.players.length < 2) {
      return interaction.reply({ content: "❗ نحتاج على الأقل لاعبين اثنين!", ephemeral: true });
    }
    raceGame.players.forEach((id, index) => {
      const team = index % 2 === 0 ? "red" : "blue";
      raceGame.teams[team].push(id);
    });
    raceGame.currentPlayers.red = raceGame.teams.red[0];
    raceGame.currentPlayers.blue = raceGame.teams.blue[0];

    await interaction.reply(`🚦 بدأ المسار! الدور الأول لفريق 🔴 الأحمر. أول لاعب: <@${raceGame.currentPlayers.red}>`);
    await showRaceStatus(raceGame);
    await showRollButton(raceGame);

    setTimeout(async () => {
      if (!raceGame) return;
      const team = raceGame.turn;
      const msg = await raceGame.channel.messages.fetch({ limit: 1 }).then(col => col.first());
      if (msg && msg.components[0]?.components[0]?.customId === "roll_dice") {
        const teamPlayers = raceGame.teams[team];
        const currentIndex = teamPlayers.indexOf(raceGame.currentPlayers[team]);
        const nextIndex = (currentIndex + 1) % teamPlayers.length;
        raceGame.currentPlayers[team] = teamPlayers[nextIndex];

        await raceGame.channel.send(`⏱️ الوقت انتهى! ننتقل إلى: <@${raceGame.currentPlayers[team]}>`);
        await showRollButton(raceGame);
      }
    }, 15000);
  }

  if (interaction.customId === "roll_dice") {
    const team = raceGame.turn;
    if (interaction.user.id !== raceGame.currentPlayers[team]) {
      return interaction.reply({ content: "❌ ليس دورك الآن!", ephemeral: true });
    }
    const roll = Math.floor(Math.random() * 6) + 1;
    raceGame.positions[team] += roll;
    if (raceGame.positions[team] >= 20) {
      const canvas = createCanvas(800, 300);
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < 20; i++) {
        const x = 30 + i * 36;
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(x, 130, 30, 30);
        ctx.strokeStyle = "#999";
        ctx.strokeRect(x, 130, 30, 30);
        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        ctx.fillText(i + 1, x + 15, 150);
      }

      const redX = 30 + (raceGame.positions.red >= 20 ? 19 : raceGame.positions.red) * 36 + 15;
      const blueX = 30 + (raceGame.positions.blue >= 20 ? 19 : raceGame.positions.blue) * 36 + 15;

      ctx.beginPath();
      ctx.arc(redX, 120, 10, 0, Math.PI * 2);
      ctx.fillStyle = "red";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(blueX, 180, 10, 0, Math.PI * 2);
      ctx.fillStyle = "blue";
      ctx.fill();

      const drawAvatars = async (team, y) => {
        for (let i = 0; i < raceGame.teams[team].length; i++) {
          const id = raceGame.teams[team][i];
          const member = await client.users.fetch(id);
          const avatar = await loadImage(member.displayAvatarURL({ extension: 'png', size: 64 }));
          ctx.save();
          ctx.beginPath();
          ctx.arc(50 + i * 70, y, 25, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatar, 50 + i * 70 - 25, y - 25, 50, 50);
          ctx.restore();
        }
      };

      await drawAvatars("red", 50);
      await drawAvatars("blue", 250);

      ctx.font = "bold 24px Arial";
      ctx.fillStyle = team === "red" ? "red" : "blue";
      ctx.fillText("👑 الفريق الفائز!", 600, 40);

      const buffer = canvas.toBuffer();
      await interaction.channel.send({ content: `🏆 الفريق الفائز هو: ${team === "red" ? raceGame.teams.red.map(id => `<@${id}>`).join(" ") : raceGame.teams.blue.map(id => `<@${id}>`).join(" ")}`, files: [{ attachment: buffer, name: "final_race.png" }] });

      raceGame = null;
isAnyGameRunning = false;
      return;
    }
    raceGame.turn = team === "red" ? "blue" : "red";
    const nextTeam = raceGame.turn;
    const teamPlayers = raceGame.teams[nextTeam];
    const currentIndex = teamPlayers.indexOf(raceGame.currentPlayers[nextTeam]);
    const nextIndex = (currentIndex + 1) % teamPlayers.length;

    // ✅ تطبيق تأثيرات الخانات الخاصة
    const traps = [2, 5, 8, 13, 17];
    const boosts = [6, 14];

    let message = `🎲 <@${interaction.user.id}> رمى ${roll} لفريق ${team === "red" ? "🔴 الأحمر" : "🔵 الأزرق"}!`;

if (traps.includes(raceGame.positions[team])) {
  raceGame.positions[team] = Math.max(0, raceGame.positions[team] - 3);
  message += `
⛏️ فخ! عاد 3 خانات.`;
} else if (boosts.includes(raceGame.positions[team])) {
  raceGame.positions[team] += 2;
  message += `
🎁 كنز! تقدم خانتين.`;
}

await interaction.reply({ content: message });
    raceGame.currentPlayers[nextTeam] = teamPlayers[nextIndex];

    
    await showRaceStatus(raceGame);
    await showRollButton(raceGame);
  }
});

async function showRaceStatus(raceGame) {
  const canvas = createCanvas(800, 300);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const traps = [2, 5, 8, 13, 17];
  const boosts = [6, 14];

  for (let i = 0; i < 20; i++) {
    const x = 30 + i * 36;

    if (traps.includes(i)) {
      ctx.fillStyle = "#ffcccc"; // فخ
    } else if (boosts.includes(i)) {
      ctx.fillStyle = "#ccffcc"; // كنز
    } else {
      ctx.fillStyle = "#f0f0f0";
    }

    ctx.fillRect(x, 130, 30, 30);
    ctx.strokeStyle = "#999";
    ctx.strokeRect(x, 130, 30, 30);
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";
    ctx.fillText(i + 1, x + 15, 150);
  }

  // وضع الفرق على المسار
  const redPos = raceGame.positions.red;
  const bluePos = raceGame.positions.blue;
  const redX = 30 + (redPos >= 20 ? 19 : redPos) * 36 + 15;
  const blueX = 30 + (bluePos >= 20 ? 19 : bluePos) * 36 + 15;

  ctx.beginPath();
  ctx.arc(redX, 120, 10, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(blueX, 180, 10, 0, Math.PI * 2);
  ctx.fillStyle = "blue";
  ctx.fill();

  const drawAvatars = async (team, y) => {
    for (let i = 0; i < raceGame.teams[team].length; i++) {
      const id = raceGame.teams[team][i];
      const member = await client.users.fetch(id);
      const avatar = await loadImage(member.displayAvatarURL({ extension: 'png', size: 64 }));
      ctx.save();
      ctx.beginPath();
      ctx.arc(50 + i * 70, y, 25, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, 50 + i * 70 - 25, y - 25, 50, 50);
      ctx.restore();
    }
  };

  await drawAvatars("red", 50);
  await drawAvatars("blue", 250);

  const buffer = canvas.toBuffer();
  await raceGame.channel.send({ files: [{ attachment: buffer, name: "race_map.png" }] });
}

async function showRollButton(raceGame) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("roll_dice")
      .setLabel(`🎲 رمي النرد (لفريق ${raceGame.turn === "red" ? "🔴 الأحمر" : "🔵 الأزرق"})`)
      .setStyle(ButtonStyle.Secondary)
  );

  await raceGame.channel.send({ content: `🎯 دور: <@${raceGame.currentPlayers[raceGame.turn]}>`, components: [row] });
}
/////////////

const allowedChannel = "1271818515103354961"; // ID الروم

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  if (msg.channel.id !== allowedChannel) return;

  let stock = db.get("stock");
  if (typeof stock !== "number") stock = 0;

  let rewardMilestones = db.get("rewardMilestones");
  if (!Array.isArray(rewardMilestones)) {
    rewardMilestones = [10, 50, 100];
    db.set("rewardMilestones", rewardMilestones);
  }

  // إذا كتب الرقم الصحيح
  if (msg.content.trim() === stock.toString()) {
    stock++;
    db.set("stock", stock);

    if (rewardMilestones.includes(stock-1)) {
      const rewardMessage = await msg.reply(`🎉 مبروك! وصلت للستوك ${stock-1} وفزت بالجائزة!`);

      rewardMessage.pin().catch(err => {
        console.error("❌ ما قدرت أثبت الرسالة:", err);
      });
    }
  } 

  else {
    try {
      await msg.delete();
    } catch (err) {
      console.error("❌ ما قدرت أحذف الرسالة:", err);
    }
  }
});

client.on("messageCreate", msg => {
  if (!msg.content.startsWith("!setr")) return;
  if (!msg.member.permissions.has("Administrator")) return; 

  const args = msg.content.split(" ").slice(1);
  const newRewards = args.map(Number).filter(num => !isNaN(num));

  if (newRewards.length === 0) {
    return msg.reply("🚫 لازم تدخل أرقام صحيحة مثل: `!setr 10 50 100`");
  }

  db.set("rewardMilestones", newRewards);
  rewardMilestones = newRewards;

  msg.reply(`✅ تم تحديث أرقام الجوائز إلى: ${newRewards.join(", ")}`);
});


/////////////////////////////سباق الاسئلة /////////////////////


const MAX_PLAYERS = 20;
const MIN_PLAYERS = 4;
const TOTAL_GATES = 10;
const QUESTION_TIMEOUT = 15000;
const JOIN_TIMEOUT = 30000;
const ADMIN_ROLE_ID = '1074286886543175722';

let gameState = {
  isActive: false,
  players: new Map(),
  joinedPlayers: [],
  currentQuestion: null,
  channel: null,
  timeout: null,
  joinTimeout: null,
  questionId: 0,
  currentMessage: null,
  controlMessageId: null
};

client.tempQuestions = new Map();

client.on('messageCreate', async (message) => {
const member = message.member;
  if (message.author.bot) return;

  if (message.content.toLowerCase() === '!سباق') {
if (!member.roles.cache.has(REQUIRED_ROLE_ID)) {
  return message.react('❌');
}
if (isAnyGameRunning) return message.channel.send('❗ هناك لعبة قيد التشغيل.');

  isAnyGameRunning = true;

    if (gameState.isActive || gameState.controlMessageId) {
      return message.channel.send('🚫 توجد لعبة قيد التشغيل أو بانتظار اللاعبين بالفعل.');
    }

    gameState.channel = message.channel;
    gameState.joinedPlayers = [];

    const joinButton = new ButtonBuilder()
      .setCustomId('join_sgame')
      .setLabel('🔹 انضمام')
      .setStyle(ButtonStyle.Primary);

    const startButton = new ButtonBuilder()
      .setCustomId('begin_game')
      .setLabel('🚀 بدء اللعبة')
      .setStyle(ButtonStyle.Success);
const spag = new EmbedBuilder()
    .setTitle(`سباق الأسئلة 🎮`)
    .setDescription(`حل الاسئلة وسابق اللاعبين للوصول الى البوابة الاخيرة للفوز!\n\n اضغط انضمام للانضمام، ثم انظر المسؤول يبدأ اللعبة.`)
    .setColor('#0aa0e6')
    .setFooter({ text: 'سيتم الغاء اللعبة خلال 30 ثانية في حال ما خش 4 اشخاص على الأقل' });
    const row = new ActionRowBuilder().addComponents(joinButton, startButton);

    const sent = await message.channel.send({
      embeds: [spag],
      components: [row]
    });

    gameState.controlMessageId = sent.id;

    if (gameState.joinTimeout) clearTimeout(gameState.joinTimeout);
    gameState.wasManuallyCancelled = false;

    gameState.joinTimeout = setTimeout(() => {
      if (gameState.wasManuallyCancelled) return;
      if (!gameState.isActive && gameState.joinedPlayers.length < MIN_PLAYERS) {
        message.channel.send('⌛ لم ينضم العدد الكافي من اللاعبين. تم إلغاء اللعبة.');
        disableButtons(sent);
        resetGame();
      }
    }, JOIN_TIMEOUT);
  }


  if (message.content.toLowerCase() === '!addquestion') {
    const addQButton = new ButtonBuilder()
      .setCustomId('add_question_step1')
      .setLabel('➕ إضافة سؤال')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(addQButton);

    await message.channel.send({
      content: '📋 لإضافة سؤال جديد، اضغط على الزر التالي:',
      components: [row]
    });
  }
});

client.on('messageDelete', async (message) => {
  if (!gameState.controlMessageId) return;

  if (message.id === gameState.controlMessageId || message.author?.id === client.user.id) {
    if (gameState.channel) {
      gameState.channel.send('🛑 تم حذف رسالة من رسائل اللعبة لذا تم الغاء اللعبة.');
    }
    resetGame();
  }
});


client.on(Events.InteractionCreate, async (interaction) => {
  try {

    const userId = interaction.user.id; 
    if (interaction.customId === 'add_question_step1') {
      const modal = new ModalBuilder()
        .setCustomId('question_step1')
        .setTitle('📝 الخطوة 1: نص السؤال');

      const questionInput = new TextInputBuilder()
        .setCustomId('question_text')
        .setLabel('اكتب نص السؤال هنا')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(questionInput));

       interaction.showModal(modal);
    }

    if (interaction.customId === 'question_step1') {
      const questionText = interaction.fields.getTextInputValue('question_text');
      client.tempQuestions.set(userId, { question: questionText });

      const continueBtn = new ButtonBuilder()
        .setCustomId('add_question_step2')
        .setLabel('➡️ أضف الخيارات والإجابة')
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(continueBtn);

       interaction.reply({
        content: '✅ تم حفظ نص السؤال مؤقتاً. اضغط الزر لإضافة الخيارات:',
        components: [row],
        ephemeral: true
      });
    }

    if (interaction.customId === 'add_question_step2') {
      const modal = new ModalBuilder()
        .setCustomId('question_step2')
        .setTitle('🧩 الخطوة 2: الخيارات والإجابة');

      const opt1 = new TextInputBuilder().setCustomId('opt1').setLabel('الخيار 1').setStyle(TextInputStyle.Short).setRequired(true);
      const opt2 = new TextInputBuilder().setCustomId('opt2').setLabel('الخيار 2').setStyle(TextInputStyle.Short).setRequired(true);
      const opt3 = new TextInputBuilder().setCustomId('opt3').setLabel('الخيار 3').setStyle(TextInputStyle.Short).setRequired(true);
      const opt4 = new TextInputBuilder().setCustomId('opt4').setLabel('الخيار 4').setStyle(TextInputStyle.Short).setRequired(true);
      const answer = new TextInputBuilder().setCustomId('answer').setLabel('رقم الإجابة الصحيحة (0-3)').setStyle(TextInputStyle.Short).setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(opt1),
        new ActionRowBuilder().addComponents(opt2),
        new ActionRowBuilder().addComponents(opt3),
        new ActionRowBuilder().addComponents(opt4),
        new ActionRowBuilder().addComponents(answer)
      );

        interaction.showModal(modal); 
    }

    if (interaction.customId === 'question_step2') {
      const temp = client.tempQuestions.get(userId);
      if (!temp) return interaction.reply({ content: '❌ لم يتم العثور على نص السؤال. أعد المحاولة.', ephemeral: true });

      const options = [
        interaction.fields.getTextInputValue('opt1'),
        interaction.fields.getTextInputValue('opt2'),
        interaction.fields.getTextInputValue('opt3'),
        interaction.fields.getTextInputValue('opt4')
      ];
      const answer = parseInt(interaction.fields.getTextInputValue('answer'));

      if (isNaN(answer) || answer < 0 || answer > 3) {
        return interaction.reply({ content: '⚠️ رقم الإجابة يجب أن يكون بين 0 و 3.', ephemeral: true });
      }

      const newQ = {
        question: temp.question,
        options,
        answer
      };

      const questions = db.get('questions') || [];
      questions.push(newQ);
      db.set('questions', questions);

      client.tempQuestions.delete(userId);

      await interaction.reply({ content: '✅ تم حفظ السؤال بنجاح!', ephemeral: true });
    }

    if (interaction.customId.startsWith('answer_') && gameState.isActive) {
      const [_, optionIndexStr, questionIdStr] = interaction.customId.split('_');
      const optionIndex = parseInt(optionIndexStr);
      const questionId = parseInt(questionIdStr);

      if (questionId !== gameState.questionId) {
        return interaction.reply({ content: '❌ انتهى وقت هذا السؤال أو أنه قديم.', ephemeral: true });
      }

      if (!gameState.players.has(userId)) return interaction.reply({ content: '❌ أنت لست من ضمن اللاعبين.', ephemeral: true });
      if (!gameState.currentQuestion) return interaction.reply({ content: '⚠️ لا يوجد سؤال حالياً.', ephemeral: true });
      if (!gameState.currentQuestion.answers) gameState.currentQuestion.answers = new Map();
      if (gameState.currentQuestion.answers.has(userId)) return interaction.reply({ content: '❗ لقد أجبت بالفعل.', ephemeral: true });

      gameState.currentQuestion.answers.set(userId, optionIndex);
      return interaction.reply({ content: '✅ تم تسجيل إجابتك!', ephemeral: true });
    }
    
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;


  if (interaction.customId === 'join_sgame') {
  const userId = interaction.user.id;

  if (!gameState.joinedPlayers.includes(userId)) {
    if (gameState.joinedPlayers.length >= MAX_PLAYERS) {
      return interaction.reply({
        content: '❌ الحد الأقصى للاعبين تم الوصول إليه!',
        ephemeral: true
      });
    }

    gameState.joinedPlayers.push(userId);

    const joinMentions = gameState.joinedPlayers.map(id => `<@${id}>`).join('\n');
const spage = new EmbedBuilder()
    .setTitle(`سباق الأسئلة`)
    .setDescription(`🎮 انقر على الزر للانضمام إلى لعبة سباق الأسئلة!\n` +
      `المشاركين: (${gameState.joinedPlayers.length}/${MAX_PLAYERS}):\n${joinMentions}\n\n` +
      `بمجرد انضمام اللاعبين، المسؤول يضغط على زر "بدء اللعبة".`)
    .setColor('#00AAFF')
    .setFooter({ text: 'سيتم الغاء اللعبة خلال 30 ثانية في حال ما خش 4 اشخاص على الأقل' });


    try {
      const message = await gameState.channel.messages.fetch(gameState.controlMessageId);
      await message.edit({ embeds: [spage] });
    } catch (error) {
      console.error('فشل في تعديل رسالة اللعبة:', error);
    }

    return interaction.reply({
      content: `✅ <@${userId}> انضم إلى اللعبة!`,
      ephemeral: true
    });
  } else {
    return interaction.reply({
      content: '⚠️ أنت بالفعل منضم!',
      ephemeral: true
    });
  }
}


    if (interaction.customId === 'begin_game') {
      const member = interaction.guild.members.cache.get(userId);
      if (!interaction.member.roles.cache.has(REQUIRED_ROLE_ID)) {
    return interaction.reply({ content: '🚫 لا تملك صلاحية بدء اللعبة.', ephemeral: true });
  }

      if (gameState.joinedPlayers.length < MIN_PLAYERS) {
        return interaction.reply({ content: `🚫 تحتاج على الأقل ${MIN_PLAYERS} لاعبين لبدء اللعبة.`, ephemeral: true });
      }

      gameState.isActive = true;
      gameState.players = new Map();
      gameState.joinedPlayers.forEach(id => gameState.players.set(id, 1));
      await interaction.reply({ content: '🚀 بدء اللعبة!', ephemeral: true });

      disableButtons(await gameState.channel.messages.fetch(gameState.controlMessageId));
      sendQuestion();
    }


  } catch (error) {
    console.error('❌ حدث خطأ أثناء المعالجة:', error);
  }
});

async function disableButtons(message) {
  if (!message) return;
  const disabledComponents = message.components.map(row => {
    const newRow = ActionRowBuilder.from(row);
    newRow.components = row.components.map(comp => ButtonBuilder.from(comp).setDisabled(true));
    return newRow;
  });
  message.edit({ components: disabledComponents });
}

async function sendQuestion() {
  const allQuestions = db.get('questions') || [];
  if (allQuestions.length === 0) {
    return gameState.channel.send('🚫 لا يوجد أسئلة في قاعدة البيانات.');
  }

  const usedIds = gameState.usedQuestionIds || new Set();
  const availableQuestions = allQuestions.filter(q => !usedIds.has(q.id));

  if (availableQuestions.length === 0) {
    return gameState.channel.send('✅ تم استخدام جميع الأسئلة في هذه الجولة!');
  resetGame();
  }

  const q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

  if (!gameState.usedQuestionIds) gameState.usedQuestionIds = new Set();
  gameState.usedQuestionIds.add(q.id);

  gameState.questionId++;
  gameState.currentQuestion = q;
  q.answers = new Map();
  const raceEmbed = new EmbedBuilder()
    .setTitle('🌀 حالة السباق')
    .setDescription(renderRaceStatus())
    .setColor('#00AAFF');

  await gameState.channel.send({ embeds: [raceEmbed] });
  const questionEmbed = new EmbedBuilder()
    .setTitle(`❓ سؤال جديد`)
    .setDescription(`# **${q.question}**`)
    .setColor('#00AAFF')
    .setFooter({ text: 'اختر إجابتك بالضغط على الزر المناسب خلال 15 ثانية.' });

  const row = new ActionRowBuilder().addComponents(
    q.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(`answer_${i}_${gameState.questionId}`)
        .setLabel(opt)
        .setStyle(ButtonStyle.Secondary)
    )
  );

  const questionMessage = await gameState.channel.send({ embeds: [questionEmbed], components: [row] });
  gameState.currentMessage = questionMessage;


  gameState.timeout = setTimeout(() => {
    processAnswers();
  }, QUESTION_TIMEOUT);
}


async function processAnswers() {
  const q = gameState.currentQuestion;
  for (let [userId, optionIndex] of q.answers.entries()) {
    if (optionIndex === q.answer) {
      const pos = gameState.players.get(userId);
      gameState.players.set(userId, pos + 1);
    }
  }

  const components = new ActionRowBuilder().addComponents(
    q.options.map((opt, i) =>
      new ButtonBuilder()
        .setCustomId(`answer_${i}_${gameState.questionId}`)
        .setLabel(opt)
        .setStyle(i === q.answer ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(true)
    )
  );

  const updatedEmbed = EmbedBuilder.from(gameState.currentMessage.embeds[0])
    .setFooter({ text: `الإجابة الصحيحة: ${q.options[q.answer]}` });

  await gameState.currentMessage.edit({ embeds: [updatedEmbed], components: [components] });

  const winners = [...gameState.players.entries()].filter(([id, pos]) => pos >= TOTAL_GATES);

if (winners.length > 0) {
  const winnerMentions = winners.map(([id]) => `<@${id}>`).join('، ');
  gameState.channel.send(`🏆 ${winnerMentions} وصلوا إلى البوابة ${TOTAL_GATES} وفازوا بالسباق!`);
  resetGame();
} else {
  sendQuestion();
}
}

function renderRaceStatus() {
  const status = Array.from({ length: TOTAL_GATES }, (_, i) => `بوابة ${i + 1}:`).map((line, idx) => {
    const playersHere = [...gameState.players.entries()].filter(([_, pos]) => pos === idx + 1);
    if (playersHere.length > 0) {
      line += ' ' + playersHere.map(([id]) => `<@${id}>`).join('، ');
    } else {
      line += ' لا أحد';
    }
    return line;
  });
  return status.join('\n');
}

function resetGame() {
  gameState = {
    isActive: false,
    players: new Map(),
    joinedPlayers: [],
    currentQuestion: null,
    channel: null,
    timeout: null,
    questionId: 0,
    currentMessage: null,
    controlMessageId: null, // مهم!
    joinTimeout: null,
    usedQuestions: [],
    wasManuallyCancelled: true
  };
  isAnyGameRunning = false;   
}
client.login('');