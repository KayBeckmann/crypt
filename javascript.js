        const CHARSET_S = [];
        for (let i = 32; i <= 126; i++) { // ASCII Space bis ~ (95 Zeichen)
            CHARSET_S.push(String.fromCharCode(i));
        }
        const K_ALTERNATIVES_PER_CHAR = 50; 
        const N_MAX_DIMENSION_ALLOWED = 4; // Harte Grenze für N

        let limitedCoordsMap = {}; 
        let cacheDimension = 0; 
        let isInitializing = false;

        // DOM Elemente
        let dimensionsInput, initHypercubeBtn, encryptBtn, decryptBtn, 
            progressContainer, initProgress, progressText, messagesElem, 
            inputTextElem, outputTextElem, kAlternativesDisplay;

        document.addEventListener('DOMContentLoaded', () => {
            dimensionsInput = document.getElementById('dimensions');
            initHypercubeBtn = document.getElementById('initHypercubeBtn');
            encryptBtn = document.getElementById('encryptBtn');
            decryptBtn = document.getElementById('decryptBtn');
            progressContainer = document.getElementById('progressContainer');
            initProgress = document.getElementById('initProgress');
            progressText = document.getElementById('progressText');
            messagesElem = document.getElementById('messages');
            inputTextElem = document.getElementById('inputText');
            outputTextElem = document.getElementById('outputText');
            kAlternativesDisplay = document.getElementById('kAlternativesDisplay');
            kAlternativesDisplay.textContent = K_ALTERNATIVES_PER_CHAR;


            dimensionsInput.addEventListener('input', () => {
                // Wenn N geändert wird, muss neu initialisiert werden.
                // Die Meldung wird von updateButtonStates gesetzt.
                updateButtonStates();
            });
            updateButtonStates(); // Initialer Zustand der Buttons
        });
        
        function coordsToLinearIndex(coords) {
            let index = 0;
            const N = coords.length;
            for (let i = 0; i < N; i++) {
                index += coords[i] * Math.pow(26, N - 1 - i);
            }
            return index;
        }

        function updateButtonStates() {
            if (!dimensionsInput) return; // DOM noch nicht bereit

            const N = parseInt(dimensionsInput.value, 10);
            let validN = !isNaN(N) && N > 0 && N <= N_MAX_DIMENSION_ALLOWED;
            
            initHypercubeBtn.disabled = !validN || isInitializing;
            
            if (validN && N === cacheDimension && Object.keys(limitedCoordsMap).length > 0) {
                encryptBtn.disabled = isInitializing;
                decryptBtn.disabled = isInitializing;
                 if (messagesElem.textContent.includes("Bitte Hypercube für Dimension")) {
                    messagesElem.textContent = `Hypercube für N=${N} ist initialisiert.`;
                    messagesElem.className = 'success';
                 }
            } else {
                encryptBtn.disabled = true;
                decryptBtn.disabled = true;
                if (validN && !isInitializing) {
                    messagesElem.textContent = `Bitte Hypercube für Dimension N=${N} initialisieren.`;
                    messagesElem.className = 'info';
                } else if (!validN && !isNaN(N) && N > N_MAX_DIMENSION_ALLOWED) {
                    messagesElem.textContent = `Dimension N=${N} ist zu hoch. Max. ${N_MAX_DIMENSION_ALLOWED} erlaubt.`;
                    messagesElem.className = 'error';
                } else if (!validN && !isNaN(N) && N <= 0) {
                     messagesElem.textContent = `Dimension N muss positiv sein.`;
                     messagesElem.className = 'error';
                }
            }
        }
        
        async function initializeLimitedCoordsMap(N_dim, progressUpdateCallback) {
            const newMap = {};
            if (N_dim <= 0 || N_dim > N_MAX_DIMENSION_ALLOWED || CHARSET_S.length === 0) {
                console.error("Ungültige Dimension oder leeres CHARSET_S für Cache-Initialisierung.");
                if (progressUpdateCallback) progressUpdateCallback(0, 1, true); // Fehler signalisieren
                return newMap;
            }

            for (const char of CHARSET_S) {
                newMap[char] = [];
            }

            const currentCoords_outer = new Array(N_dim).fill(0);
            const totalIterations = Math.pow(26, N_dim);
            let processedIterations_outer = 0;
            // Kleinere Chunks für flüssigere Updates, aber nicht zu klein wegen Overhead
            const iterationsPerChunk = Math.max(1000, Math.ceil(totalIterations / 500)); 

            if (progressUpdateCallback) progressUpdateCallback(0, totalIterations);

            async function processChunk() {
                const chunkEndTime = Date.now() + 30; // Block für max. 30ms um UI responsiv zu halten

                while(Date.now() < chunkEndTime && processedIterations_outer < totalIterations) {
                    const linearIndex = coordsToLinearIndex(currentCoords_outer);
                    const charInCell = CHARSET_S[linearIndex % CHARSET_S.length];
                    
                    if (newMap[charInCell] && newMap[charInCell].length < K_ALTERNATIVES_PER_CHAR) {
                        newMap[charInCell].push([...currentCoords_outer]);
                    }

                    processedIterations_outer++;
                    if (processedIterations_outer >= totalIterations) break;

                    // Nächste Koordinate nur wenn nicht die letzte Iteration
                    let i = N_dim - 1;
                    while (i >= 0) {
                        currentCoords_outer[i]++;
                        if (currentCoords_outer[i] < 26) break; 
                        currentCoords_outer[i] = 0; 
                        i--;
                        if (i < 0 && processedIterations_outer < totalIterations) { // Sollte nicht passieren wenn totalIterations korrekt
                            console.error("Koordinatenüberlauf vor Erreichen aller Iterationen"); 
                            break; // Sicherheitsausstieg
                        }
                    }
                }

                if (progressUpdateCallback) progressUpdateCallback(processedIterations_outer, totalIterations);

                if (processedIterations_outer < totalIterations) {
                    await new Promise(resolve => setTimeout(resolve, 0)); // Kurze Pause für UI-Thread
                    await processChunk(); 
                }
            }

            await processChunk();
            return newMap;
        }

        async function handleInitializeHypercube() {
            const N = parseInt(dimensionsInput.value, 10);

            if (isNaN(N) || N <= 0 || N > N_MAX_DIMENSION_ALLOWED) {
                messagesElem.textContent = `Ungültige Dimension N=${N}. Muss zwischen 1 und ${N_MAX_DIMENSION_ALLOWED} sein.`;
                messagesElem.className = 'error';
                updateButtonStates();
                return;
            }

            isInitializing = true;
            updateButtonStates(); // Deaktiviert Buttons während der Initialisierung

            progressContainer.style.display = 'block';
            initProgress.value = 0;
            progressText.textContent = '0%';
            messagesElem.textContent = `Initialisiere für Dimension N=${N}...`;
            messagesElem.className = 'info';

            try {
                const startTime = Date.now();
                const newMap = await initializeLimitedCoordsMap(N, (current, total, error = false) => {
                    if (error) {
                        messagesElem.textContent = 'Fehler bei der Initialisierung.';
                        messagesElem.className = 'error';
                        progressContainer.style.display = 'none';
                        return;
                    }
                    const percent = total === 0 ? 0 : Math.round((current / total) * 100);
                    initProgress.value = percent;
                    progressText.textContent = `${percent}%`;
                });
                const duration = (Date.now() - startTime) / 1000; // Dauer in Sekunden
                
                limitedCoordsMap = newMap; 
                cacheDimension = N;       

                messagesElem.textContent = `Initialisierung für N=${N} abgeschlossen in ${duration.toFixed(1)}s. ${Object.values(limitedCoordsMap).reduce((sum, arr) => sum + arr.length, 0)} Koordinaten-Sets gesammelt.`;
                messagesElem.className = 'success';
                // progressContainer.style.display = 'none'; // Optional, Fortschritt sichtbar lassen bis nächste Aktion

            } catch (e) {
                console.error("Fehler während der Initialisierung:", e);
                messagesElem.textContent = 'Ein Fehler ist während der Initialisierung aufgetreten.';
                messagesElem.className = 'error';
                progressContainer.style.display = 'none';
                limitedCoordsMap = {}; 
                cacheDimension = 0;    
            } finally {
                isInitializing = false;
                updateButtonStates(); 
            }
        }
        
        function numToAlpha(num) { /* ... unverändert ... */ 
            if (num >= 0 && num <= 25) { return String.fromCharCode('a'.charCodeAt(0) + num); } return '?';
        }
        function alphaToNum(alphaChar) { /* ... unverändert ... */
            if (alphaChar >= 'a' && alphaChar <= 'z') { return alphaChar.charCodeAt(0) - 'a'.charCodeAt(0); } return -1;
        }

        async function processText(isEncrypt) { // async, falls Init automatisch erfolgen soll (hier nicht der Fall)
            const N = parseInt(dimensionsInput.value, 10);

            if (isNaN(N) || N <= 0 || N > N_MAX_DIMENSION_ALLOWED) {
                messagesElem.textContent = `Ungültige Dimension N=${N}.`;
                messagesElem.className = 'error';
                return;
            }

            if (N !== cacheDimension || Object.keys(limitedCoordsMap).length === 0) {
                messagesElem.textContent = `Hypercube für Dimension N=${N} ist nicht initialisiert. Bitte zuerst über den Button initialisieren.`;
                messagesElem.className = 'error'; // Deutlicher als 'info'
                // Optional: hier automatisch handleInitializeHypercube() aufrufen, aber expliziter Button ist besser für lange Dauer
                // await handleInitializeHypercube(); // Wenn automatisch, dann muss processText auch async sein
                // if (N !== cacheDimension) return; // Erneut prüfen nach automatischer Init
                return;
            }

            const inputText = inputTextElem.value;
            let output = "";
            let unhandledChars = new Set();
            const usageCounters = {}; 

            if (isEncrypt) {
                for (let i = 0; i < inputText.length; i++) {
                    const char_in = inputText[i];
                    const coord_list = limitedCoordsMap[char_in];

                    if (coord_list && coord_list.length > 0) {
                        const currentIndex = usageCounters[char_in] || 0;
                        const selected_coords = coord_list[currentIndex % coord_list.length];
                        usageCounters[char_in] = currentIndex + 1;
                        output += selected_coords.map(c => numToAlpha(c)).join('');
                    } else {
                        output += char_in; 
                        unhandledChars.add(char_in);
                    }
                }
                let finalMessage = "Verschlüsselung abgeschlossen.";
                let messageClass = "success";
                if (unhandledChars.size > 0) {
                    finalMessage += ` Einige Zeichen (${Array.from(unhandledChars).join(', ')}) wurden unverändert übernommen.`;
                    messageClass = "warning";
                }
                messagesElem.textContent = finalMessage;
                messagesElem.className = messageClass;

            } else { // Entschlüsseln
                let currentPos = 0;
                while (currentPos < inputText.length) {
                    if (inputText.length - currentPos < N) {
                        output += inputText.substring(currentPos); 
                        break;
                    }
                    
                    let potentialChunk = inputText.substring(currentPos, currentPos + N);
                    let isAlphaCoordChunk = true;
                    const coords = [];

                    for (let k=0; k < N; k++) {
                        const val = alphaToNum(potentialChunk[k]);
                        if (val === -1) { 
                            isAlphaCoordChunk = false;
                            break;
                        }
                        coords.push(val);
                    }

                    if (isAlphaCoordChunk) {
                        const linearIndex = coordsToLinearIndex(coords);
                        if (CHARSET_S.length > 0) {
                            output += CHARSET_S[linearIndex % CHARSET_S.length];
                        } else {
                            output += '?'; 
                        }
                        currentPos += N; 
                    } else {
                        output += inputText[currentPos];
                        currentPos++; 
                    }
                }
                messagesElem.textContent = 'Entschlüsselungsversuch abgeschlossen.';
                messagesElem.className = 'success';
            }
            outputTextElem.value = output;
        }