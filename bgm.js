/*
 * ASTRAL DRIFT - BGM マネージャー（別ファイル）
 * -------------------------------------------------
 * astral-drift.html と同じフォルダに置いて使ってください。
 * 実際に鳴らす曲は用意されていないので、下の TRACKS 配列と
 * BOSS_TRACK を、お手持ちの音源ファイル名に書き換えてください。
 *
 * 動作（ステージBGM）:
 *   - ゲーム開始時に10曲をシャッフルして「山（bag）」を作る
 *   - 1曲終わるたびに山から次の1曲を引いて再生する
 *   - 山を使い切る（10曲すべて再生し終わる）までは同じ曲は出てこない
 *   - 山を使い切ったら、その場でもう一度シャッフルして新しい山を作る
 *     （1プレイ10分前後なら、通常は山を1周する前にゲームが終わります）
 *
 * 動作（ボス戦BGM）:
 *   - ボス出現時に playBoss() を呼ぶと、ステージBGMの山を中断して
 *     専用のボス戦テーマ（BOSS_TRACK）をループ再生に切り替える
 *   - ボス戦テーマは1曲のみをループし続ける（山からは引かない）
 *
 * astral-drift.html 側からは window.AstralBGM として
 *   AstralBGM.start()    ... 出撃時に呼び出し（ステージBGMをシャッフルして再生開始）
 *   AstralBGM.playBoss() ... ボス出現時に呼び出し（ボス戦テーマへ切り替え、ループ再生）
 *   AstralBGM.pause()    ... ポーズ時に呼び出し
 *   AstralBGM.resume()   ... ポーズ解除時に呼び出し
 *   AstralBGM.stop()     ... リザルト/タイトル遷移時に呼び出し（停止＆巻き戻し）
 *   AstralBGM.setVolume(0〜1)
 * を呼んでいます。ファイルが用意できていない間はエラーにならず、
 * 再生に失敗しても黙って無視するようにしてあります。
 */
(function () {
  "use strict";

  // ここを実際のBGMファイルに差し替えてください（ステージ用10曲）
  const TRACKS = [
    "Quarter_in_the_Slot.mp3",
    "Sunday_Morning_Gold.mp3",
    "Beyond_the_Outer_Rim.mp3",
    "Terminal_Velocity_Run.mp3",
    "Apex_Trajectory.mp3",
    "Chasing_The_Solar_Wind.mp3",
    "Beyond_The_Solar_Gate.mp3",
    "Sunday_Morning_at_Warp.mp3",
    "Gravity_of_a_Distant_Sun.mp3",
    "Orbiting_the_Last_Sun.mp3",
  ];

  // ここをボス戦専用テーマのファイルに差し替えてください
  const BOSS_TRACK = "Iron_Teeth.mp3";

  let audio = null;
  let bag = [];
  let volume = 0.6;
  let running = false;
  let mode = "stage"; // "stage" | "boss"

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function refillBag() {
    bag = shuffle(TRACKS);
  }

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.addEventListener("ended", function () {
      // ボス戦テーマはloop=trueなので基本ここには来ないが、念のためモード確認
      if (mode === "stage") playNext();
    });
    return audio;
  }

  function playNext() {
    if (!running || mode !== "stage") return;
    if (!bag.length) refillBag(); // 全曲使い切ったら再抽選
    const track = bag.shift();
    const el = ensureAudio();
    el.loop = false;
    el.src = track;
    el.volume = volume;
    el.play().catch(function () {
      // 自動再生ブロックやファイル未配置時はここで失敗するが、
      // ゲーム進行には影響させず黙って無視する
    });
  }

  const AstralBGM = {
    start: function () {
      running = true;
      mode = "stage";
      refillBag();
      playNext();
    },
    playBoss: function () {
      running = true;
      mode = "boss";
      const el = ensureAudio();
      el.loop = true;
      el.src = BOSS_TRACK;
      el.volume = volume;
      el.play().catch(function () {});
    },
    stop: function () {
      running = false;
      mode = "stage";
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.loop = false;
      }
    },
    pause: function () {
      if (audio) audio.pause();
    },
    resume: function () {
      if (!running) return;
      if (audio) audio.play().catch(function () {});
    },
    setVolume: function (v) {
      volume = Math.max(0, Math.min(1, v));
      if (audio) audio.volume = volume;
    },
  };

  window.AstralBGM = AstralBGM;
})();
