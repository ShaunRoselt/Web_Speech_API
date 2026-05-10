const tabs = document.querySelectorAll('[data-tab]');
const panels = document.querySelectorAll('.tab-panel');

const ttsSupport = document.getElementById('tts-support');
const sttSupport = document.getElementById('stt-support');
const ttsText = document.getElementById('tts-text');
const voiceSelect = document.getElementById('voice-select');
const voiceLanguage = document.getElementById('voice-language');
const ttsStatus = document.getElementById('tts-status');
const speakButton = document.getElementById('speak-button');
const pauseButton = document.getElementById('pause-button');
const resumeButton = document.getElementById('resume-button');
const stopButton = document.getElementById('stop-button');
const rateInput = document.getElementById('rate');
const pitchInput = document.getElementById('pitch');
const volumeInput = document.getElementById('volume');
const rateValue = document.getElementById('rate-value');
const pitchValue = document.getElementById('pitch-value');
const volumeValue = document.getElementById('volume-value');

const recognitionLanguage = document.getElementById('recognition-language');
const continuousMode = document.getElementById('continuous-mode');
const interimMode = document.getElementById('interim-mode');
const startListeningButton = document.getElementById('start-listening');
const stopListeningButton = document.getElementById('stop-listening');
const clearTranscriptButton = document.getElementById('clear-transcript');
const copyTranscriptButton = document.getElementById('copy-transcript');
const sttStatus = document.getElementById('stt-status');
const finalTranscript = document.getElementById('final-transcript');
const interimTranscript = document.getElementById('interim-transcript');

const synthesis = window.speechSynthesis;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const speechSynthesisSupported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const speechRecognitionSupported = Boolean(SpeechRecognition);

let voices = [];
let recognition = null;
let isListening = false;
let finalizedText = '';
let liveText = '';

const setTab = (tabId) => {
  tabs.forEach((tab) => {
    const selected = tab.dataset.tab === tabId;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', active);
    panel.hidden = !active;
  });
};

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setTab(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }

    const tabList = [...tabs];
    const currentIndex = tabList.indexOf(tab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabList.length;
    if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabList.length) % tabList.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabList.length - 1;

    const nextTab = tabList[nextIndex];
    setTab(nextTab.dataset.tab);
    nextTab.focus();
    event.preventDefault();
  });
});

const updateRangeValue = (input, output) => {
  output.value = Number(input.value).toFixed(1);
};

[ [rateInput, rateValue], [pitchInput, pitchValue], [volumeInput, volumeValue] ].forEach(([input, output]) => {
  updateRangeValue(input, output);
  input.addEventListener('input', () => updateRangeValue(input, output));
});

const setTtsControlsDisabled = (disabled) => {
  [ttsText, voiceSelect, rateInput, pitchInput, volumeInput, speakButton, pauseButton, resumeButton, stopButton].forEach((control) => {
    control.disabled = disabled;
  });
};

const setSttControlsDisabled = (disabled) => {
  [recognitionLanguage, continuousMode, interimMode, startListeningButton, stopListeningButton, clearTranscriptButton, copyTranscriptButton].forEach((control) => {
    control.disabled = disabled;
  });
};

const populateVoiceSelect = () => {
  if (!speechSynthesisSupported) {
    return;
  }

  const availableVoices = synthesis.getVoices();
  if (!availableVoices.length) {
    voiceSelect.innerHTML = '<option value="">Waiting for voices…</option>';
    voiceLanguage.value = 'Loading voices…';
    return;
  }

  const previousValue = voiceSelect.value;
  voices = [...availableVoices].sort((voiceA, voiceB) => voiceA.lang.localeCompare(voiceB.lang) || voiceA.name.localeCompare(voiceB.name));
  voiceSelect.replaceChildren(
    ...voices.map((voice, index) => {
      const option = document.createElement('option');
      option.value = String(index);
      option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' — default' : ''}`;
      return option;
    }),
  );

  const selectedIndex = previousValue && voices[Number(previousValue)] ? previousValue : '0';
  voiceSelect.value = selectedIndex;
  voiceLanguage.value = voices[Number(selectedIndex)].lang;
};

const selectedVoice = () => voices[Number(voiceSelect.value)] || null;

if (speechSynthesisSupported) {
  ttsSupport.textContent = 'Supported in this browser';
  setTtsControlsDisabled(false);
  populateVoiceSelect();
  synthesis.addEventListener('voiceschanged', populateVoiceSelect);
  voiceSelect.addEventListener('change', () => {
    const voice = selectedVoice();
    voiceLanguage.value = voice ? voice.lang : 'No voice selected';
  });
} else {
  ttsSupport.textContent = 'Not supported in this browser';
  ttsStatus.textContent = 'Speech synthesis is unavailable here.';
  voiceSelect.innerHTML = '<option value="">Speech synthesis unavailable</option>';
  voiceLanguage.value = 'Unavailable';
  setTtsControlsDisabled(true);
}

const announceTtsStatus = (message) => {
  ttsStatus.textContent = message;
};

speakButton.addEventListener('click', () => {
  const text = ttsText.value.trim();
  if (!text || !speechSynthesisSupported) {
    announceTtsStatus('Enter some text before speaking.');
    return;
  }

  if (synthesis.speaking || synthesis.pending) {
    synthesis.cancel();
  }

  const utterance = new SpeechSynthesisUtterance(text);
  const voice = selectedVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  utterance.rate = Number(rateInput.value);
  utterance.pitch = Number(pitchInput.value);
  utterance.volume = Number(volumeInput.value);

  utterance.onstart = () => announceTtsStatus('Speaking…');
  utterance.onpause = () => announceTtsStatus('Speech paused.');
  utterance.onresume = () => announceTtsStatus('Speech resumed.');
  utterance.onend = () => announceTtsStatus('Done speaking.');
  utterance.onerror = (event) => announceTtsStatus(`Speech synthesis error: ${event.error}.`);

  synthesis.speak(utterance);
});

pauseButton.addEventListener('click', () => {
  if (!speechSynthesisSupported || !synthesis.speaking) {
    announceTtsStatus('Nothing is currently speaking.');
    return;
  }

  synthesis.pause();
});

resumeButton.addEventListener('click', () => {
  if (!speechSynthesisSupported || !synthesis.paused) {
    announceTtsStatus('Speech is not paused.');
    return;
  }

  synthesis.resume();
});

stopButton.addEventListener('click', () => {
  if (!speechSynthesisSupported || (!synthesis.speaking && !synthesis.pending)) {
    announceTtsStatus('Nothing is currently speaking.');
    return;
  }

  synthesis.cancel();
  announceTtsStatus('Speech stopped.');
});

const renderTranscript = () => {
  finalTranscript.textContent = finalizedText || 'Your recognized speech will appear here.';
  interimTranscript.textContent = liveText || 'Interim results will appear while listening.';
  interimTranscript.classList.toggle('muted', !liveText);
};

const announceSttStatus = (message) => {
  sttStatus.textContent = message;
};

const createRecognition = () => {
  const instance = new SpeechRecognition();
  instance.lang = recognitionLanguage.value;
  instance.continuous = continuousMode.checked;
  instance.interimResults = interimMode.checked;
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    isListening = true;
    announceSttStatus('Listening… speak into your microphone.');
  };

  instance.onresult = (event) => {
    let nextFinal = finalizedText;
    let nextInterim = '';

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcript = result[0]?.transcript ?? '';
      if (result.isFinal) {
        nextFinal = `${nextFinal}${nextFinal ? ' ' : ''}${transcript.trim()}`.trim();
      } else {
        nextInterim += transcript;
      }
    }

    finalizedText = nextFinal;
    liveText = nextInterim.trim();
    renderTranscript();
  };

  instance.onerror = (event) => {
    const message = event.error === 'not-allowed'
      ? 'Microphone permission was denied.'
      : `Speech recognition error: ${event.error}.`;
    announceSttStatus(message);
  };

  instance.onend = () => {
    isListening = false;
    if (!sttStatus.textContent.includes('error') && !sttStatus.textContent.includes('denied')) {
      announceSttStatus('Recognition stopped.');
    }
  };

  return instance;
};

if (speechRecognitionSupported) {
  sttSupport.textContent = 'Supported in this browser';
  setSttControlsDisabled(false);
} else {
  sttSupport.textContent = 'Not supported in this browser';
  announceSttStatus('Speech recognition is unavailable here.');
  setSttControlsDisabled(true);
}

startListeningButton.addEventListener('click', () => {
  if (!speechRecognitionSupported || isListening) {
    return;
  }

  recognition = createRecognition();
  try {
    recognition.start();
  } catch (error) {
    announceSttStatus('Recognition could not start. Try again in a moment.');
  }
});

stopListeningButton.addEventListener('click', () => {
  if (!recognition || !isListening) {
    announceSttStatus('Speech recognition is not active.');
    return;
  }

  recognition.stop();
  announceSttStatus('Stopping recognition…');
});

clearTranscriptButton.addEventListener('click', () => {
  finalizedText = '';
  liveText = '';
  renderTranscript();
  announceSttStatus('Transcript cleared.');
});

copyTranscriptButton.addEventListener('click', async () => {
  const text = [finalizedText, liveText].filter(Boolean).join(liveText ? '\n\n' : '');
  if (!text) {
    announceSttStatus('Nothing to copy yet.');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    announceSttStatus('Transcript copied to your clipboard.');
  } catch (error) {
    announceSttStatus('Copy failed. Your browser may block clipboard access.');
  }
});

renderTranscript();
setTab('tts');
