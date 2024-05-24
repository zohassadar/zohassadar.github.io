import './App.css';
import { useState } from 'react';

const { saveAs, MarcFile, parseBPSFile } = require('./bps.js');

const INES1HEADER = [78, 69, 83, 26, 2, 2, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function Information({ hide, information }) {
    if (hide) return;
    return (
        <div className="info">
            <p>{information}</p>
        </div>
    );
}

function SaveFile({ hide, file, text }) {
    if (hide) return;
    function downloadRom() {
        saveAs(new Blob([file.contents._u8array]), file.filename);
    }
    return (
        <div className="download">
            <button onClick={downloadRom}>{text}</button>
        </div>
    );
}

function NewFileInput({ name, handleInput, hide }) {
    if (hide) return;
    return (
        <div className="input">
            <input name={name} type="file" onInput={handleInput} />
        </div>
    );
}
/* eslint-disable */
function FileInput({ name, handleInput, hide }) {
    if (hide) return;
    function handleFileLoad(fileEvent, filename) {
        console.log(`Read ${fileEvent.target.result.length} bytes`);
        const contents = fileEvent.target.result;
        const bytes = new Uint8Array(contents.length);
        for (let i = 0; i < contents.length; i++) {
            bytes[i] = contents[i].charCodeAt(0);
        }
        handleInput({ filename: filename, contents: bytes });
    }

    function _handleInput(event) {
        const filename = event.target.files[0].name;
        const reader = new FileReader();
        reader.readAsBinaryString(event.target.files[0]);
        reader.onload = (fileEvent) => handleFileLoad(fileEvent, filename);
    }
    return (
        <>
            <input name={name} type="file" onInput={_handleInput} />
        </>
    );
}

/* eslint-enable */

function App() {
    const [rom, setRom] = useState(null);
    const [patched, setPatched] = useState(null);
    const [romInfo, setRomInfo] = useState('Waiting for Rom');
    function handleRomInput(romFile) {
        var romMarc = new MarcFile(romFile.target.files[0], onMarcRomLoad);
        function onMarcRomLoad() {
            romMarc = new MarcFile(
                new Uint8Array([...INES1HEADER, ...romMarc._u8array.slice(16)]),
            );
            setRom({
                filename: romFile.target.files[0].name,
                contents: romMarc,
            });
            // const hash = md5(romMarc._u8array).toString();
            fetch('patches/TetrisGYM-6.0.0.bps')
                .then((response) => response.blob())
                .then((patchData) => {
                    patchData.arrayBuffer().then((buffer) => {
                        try {
                            const marcPatch = new MarcFile(
                                new Uint8Array(buffer),
                            );
                            const patchParsed = parseBPSFile(marcPatch);
                            const patchedRom = patchParsed.apply(romMarc, true);
                            setRomInfo('this rom will work!');
                            setPatched({
                                filename: 'TetrisGYM-6.0.0.nes',
                                contents: patchedRom,
                                valid: true,
                            });
                        } catch (exc) {
                            setRomInfo('This is an invalid rom');
                            setPatched({ valid: false });
                        }
                    });
                });
        }
    }

    return (
        <div className="App">
            <header className="App-header">
                <div className="headerBox">
                    <Information hide={false} information="give rom" />
                    <NewFileInput
                        name="RomInput"
                        handleInput={handleRomInput}
                    />
                    <Information information={romInfo} />
                </div>
                <SaveFile
                    hide={!rom || (patched && !patched.valid)}
                    file={patched}
                    text="download patched"
                />
            </header>
        </div>
    );
}

export default App;
