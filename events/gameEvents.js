const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { renderBoard } = require('../utils/renderBoard');
const { checkWinner } = require('../utils/checkWinner');

// متغيرات اللعبة
let gameStarted = false;
let teams = { green: [], red: [] };
let ownerColors = Array.from({ length: 5 }, () => Array(5).fill(null)); // 5x5 شبكة خالية
let board = [
  ['أ', 'ب', 'ت', 'ث', 'ج'],
  ['ح', 'خ', 'د', 'ذ', 'ر'],
  ['ز', 'س', 'ش', 'ص', 'ض'],
  ['ط', 'ظ', 'ع', 'غ', 'ف'],
  ['ق', 'ك', 'ل', 'م', 'ن'],
];
let teamVotes = { green: null, red: null };

async function startGame(message) {
  if (gameStarted) return;

  gameStarted = true;
  teams.green = [];
  teams.red = [];
  teamVotes = { green: null, red: null };

  message.channel.send('🎮 لعبة خلية الحروف بدأت!');

  // تصويت لاختيار قادة الفرق
  await message.channel.send('🟢 فريق أخضر: صوتوا لاختيار قائدكم!');
  await message.channel.send('🔴 فريق أحمر: صوتوا لاختيار قائدكم!');

  // إضافة أزرار لتوزيع الأدوار
  const teamButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('green')
        .setLabel('فريق أخضر')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('red')
        .setLabel('فريق أحمر')
        .setStyle(ButtonStyle.Danger)
    );

  message.channel.send({
    content: 'انقر على زر الفريق الذي تريد الانضمام إليه!',
    components: [teamButtons],
  });
}

async function joinTeam(button, userId) {
  if (!gameStarted) return;

  if (button.customId === 'green' && !teams.green.includes(userId)) {
    teams.green.push(userId);
    button.reply({ content: '🟢 تم انضمامك للفريق الأخضر!', ephemeral: true });
  } else if (button.customId === 'red' && !teams.red.includes(userId)) {
    teams.red.push(userId);
    button.reply({ content: '🔴 تم انضمامك للفريق الأحمر!', ephemeral: true });
  }
}

async function chooseLeader(message, team) {
  if (!gameStarted) return;

  const votes = [];
  const voteMessage = await message.channel.send(`📣 صوتوا لاختيار قائد الفريق ${team === 'green' ? 'الأخضر' : 'الأحمر'}`);

  const filter = m => m.author.id !== message.author.id;
  const collector = message.channel.createMessageCollector({ filter, time: 60000 });

  collector.on('collect', (msg) => {
    if (teams[team].includes(msg.author.id) && !votes.includes(msg.author.id)) {
      votes.push(msg.author.id);
      message.channel.send(`${msg.author} صوت لصالح قائد الفريق ${team === 'green' ? 'الأخضر' : 'الأحمر'}`);
    }
  });

  collector.on('end', () => {
    if (votes.length === 0) return message.channel.send('❌ لم يصوت أحد لاختيار القائد!');
    const leader = votes[Math.floor(Math.random() * votes.length)];
    message.channel.send(`✅ تم اختيار القائد: <@${leader}>`);
    // قم بتخزين القائد وتوجيه اللعبة لمرحلة الاختيارات
  });
}

async function handleTurn(message, chosenLetter) {
  const position = findPosition(chosenLetter);
  if (!position) return message.reply('❌ هذا الحرف غير موجود في الخلية.');
  
  if (ownerColors[position.y][position.x]) return message.reply('❌ هذه الخانة مملوكة بالفعل.');

  // معالجة السؤال
  const availableQuestions = getQuestionsForLetter(chosenLetter);
  if (availableQuestions.length === 0) return message.reply('❌ لا توجد أسئلة لهذا الحرف.');

  const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

  const embed = new EmbedBuilder()
    .setTitle(`📣 سؤال لفريق ${currentTeam === 'green' ? 'الأخضر' : 'الأحمر'}`)
    .setDescription(`✳️ ${question.question}`)
    .setColor(currentTeam === 'green' ? 0x7CFC00 : 0xFF6347);

  await message.channel.send({ embeds: [embed] });

  const collector = message.channel.createMessageCollector({ time: 120000 });
  collector.on('collect', msg => {
    if (msg.author.bot) return;
    if (msg.content.trim().startsWith(question.answer)) {
      ownerColors[position.y][position.x] = currentTeam;
      collector.stop('answered');
      msg.react('✅');
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason !== 'answered') {
      message.channel.send('⏱ انتهى الوقت دون إجابة صحيحة، سيتم طرح سؤال آخر بنفس الحرف.');
      return;
    }

    const buffer = await renderBoard(board, ownerColors);
    const attachment = new AttachmentBuilder(buffer, { name: 'board.png' });
    await message.channel.send({ files: [attachment] });

    const winner = checkWinner(ownerColors);
    if (winner) {
      message.channel.send(`🏆 الفريق الفائز هو الفريق ${winner === 'green' ? 'الأخضر' : 'الأحمر'}!`);
      gameStarted = false;
    }
  });
}

function findPosition(chosenLetter) {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      if (board[y][x] === chosenLetter) {
        return { x, y };
      }
    }
  }
  return null;
}

function getQuestionsForLetter(letter) {
  // يمكن ربط هذه الوظيفة بملف الأسئلة لتحديد الأسئلة المرتبطة بكل حرف
  const questions = {
    'أ': [{ question: 'سؤال عن أ', answer: 'أ' }],
    'ب': [{ question: 'سؤال عن ب', answer: 'ب' }],
    // أضف المزيد من الحروف والأسئلة هنا
  };
  return questions[letter] || [];
}

module.exports = { startGame, joinTeam, chooseLeader, handleTurn };
