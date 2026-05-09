import React, { useState, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { Button, Modal, Form, Navbar, Nav, Container } from 'react-bootstrap';
import { BsArrowClockwise, BsPlayFill, BsFolder2Open, BsDownload, BsSave2, BsMoon, BsSun } from 'react-icons/bs';
import { FaCode } from 'react-icons/fa';

const App = () => {
    const [pythonCode, setPythonCode] = useState('');
    const [output, setOutput] = useState('');
    const [filename, setFilename] = useState('my_code');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [theme, setTheme] = useState('light');
    const [isRunning, setIsRunning] = useState(false);
    const fileInputRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const outf = (text) => {
        setOutput((prev) => prev + text);
    };

    const builtinRead = (x) => {
        if (window.Sk.builtinFiles === undefined || window.Sk.builtinFiles['files'][x] === undefined) {
            throw `File not found: '${x}'`;
        }
        return window.Sk.builtinFiles['files'][x];
    };

    // Tidak ada parsing, kode langsung dikirim ke Skulpt
    const parseSimpleCommands = (code) => code;

    const runit = (code, forceReset = false) => {
        setIsRunning(true);
        setOutput('');
        // Kode murni dari pengguna, tanpa tambahan import
        const prog = forceReset ? '' : pythonCode;

        window.Sk.pre = "output";
        window.Sk.configure({ output: outf, read: builtinRead });
        (window.Sk.TurtleGraphics || (window.Sk.TurtleGraphics = {})).target = 'mycanvas';

        window.Sk.misceval.asyncToPromise(() =>
            window.Sk.importMainWithBody('<stdin>', false, prog, true)
        ).then(
            () => {
                console.log('success');
                setIsRunning(false);
            },
            (err) => {
                setOutput((prev) => prev + err.toString());
                setIsRunning(false);
            }
        );
    };

    const resetCode = () => {
        setPythonCode('');
        setOutput('');
        runit('', true);
    };

    useEffect(() => {
        runit('', true);
    }, []);

    const handleOpenFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            setPythonCode(e.target.result);
            setFilename(file.name.replace('.py', ''));
        };
        reader.readAsText(file);
    };

    const handleSaveFile = () => {
        const blob = new Blob([pythonCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeFilename = filename.trim() !== '' ? filename.trim() : 'my_code';
        const finalFilename = safeFilename.endsWith('.py') ? safeFilename : `${safeFilename}.py`;
        link.download = finalFilename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    const themeStyles = {
        light: {
            background: '#f8f9fa',
            surface: '#ffffff',
            text: '#212529',
            border: '#dee2e6',
            outputBg: '#f1f3f5',
            outputText: '#212529',
            canvasBorder: '#dee2e6'
        },
        dark: {
            background: '#1e1e2f',
            surface: '#2d2d3f',
            text: '#e9ecef',
            border: '#444c5c',
            outputBg: '#0f0f1a',
            outputText: '#e0e0e0',
            canvasBorder: '#444c5c'
        }
    };

    const currentTheme = theme === 'light' ? themeStyles.light : themeStyles.dark;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: currentTheme.background,
            transition: 'all 0.3s ease'
        }}>
            <Navbar expand="lg" style={{
                backgroundColor: '#1e5631',
                borderBottom: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
                <Container fluid>
                    <Navbar.Brand href="#" style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '1.5rem' }}>
                        <FaCode />  bidGeometry
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" style={{ backgroundColor: '#ffffff33', border: 'none' }} />
                    <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
                        <Nav>
                            <Button
                                variant="light"
                                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    backgroundColor: '#ffffff',
                                    color: '#1e5631',
                                    border: 'none',
                                    fontWeight: '500'
                                }}
                            >
                                {theme === 'light' ? <BsMoon /> : <BsSun />}
                                {theme === 'light' ? 'Mode Gelap' : 'Mode Terang'}
                            </Button>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            <Container fluid style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{
                    display: 'grid',
                    // Kolom kanan diperlebar agar canvas 400px + padding nyaman
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 440px',
                    gap: '1.5rem',
                    alignItems: 'start'
                }}>
                    <div style={{
                        background: currentTheme.surface,
                        borderRadius: '20px',
                        padding: '1.25rem',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
                        border: `1px solid ${currentTheme.border}`
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <CodeMirror
                                placeholder="# Tulis kode Python turtle di sini..."
                                value={pythonCode}
                                height="400px"
                                theme={theme === 'dark' ? dracula : 'light'}
                                extensions={[python()]}
                                onChange={(value) => setPythonCode(value)}
                                style={{
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    border: `1px solid ${currentTheme.border}`
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                            marginBottom: '1.5rem'
                        }}>
                            <ActionButton
                                onClick={() => runit()}
                                icon={<BsPlayFill />}
                                label="Jalankan"
                                variant="primary"
                                disabled={isRunning}
                            />
                            <ActionButton
                                onClick={resetCode}
                                icon={<BsArrowClockwise />}
                                label="Reset"
                                variant="secondary"
                            />
                            <ActionButton
                                onClick={() => fileInputRef.current.click()}
                                icon={<BsFolder2Open />}
                                label="Buka File"
                                variant="outline"
                            />
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".py"
                                style={{ display: 'none' }}
                                onChange={handleOpenFile}
                            />
                            <ActionButton
                                onClick={() => setShowSaveModal(true)}
                                icon={<BsSave2 />}
                                label="Simpan File"
                                variant="outline"
                            />
                        </div>

                        <div>
                            <div style={{
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                marginBottom: '0.5rem',
                                color: currentTheme.text,
                                letterSpacing: '0.5px'
                            }}>
                                Output:
                            </div>
                            <pre style={{
                                background: currentTheme.outputBg,
                                color: currentTheme.outputText,
                                padding: '0.75rem',
                                borderRadius: '12px',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                minHeight: '80px',
                                maxHeight: '150px',
                                overflow: 'auto',
                                border: `1px solid ${currentTheme.border}`,
                                margin: 0
                            }}>
                                {output || 'Belum ada output. Klik "Jalankan" untuk melihat hasil.'}
                            </pre>
                        </div>
                    </div>

                    <div style={{
                        background: currentTheme.surface,
                        borderRadius: '20px',
                        padding: '1rem',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
                        border: `1px solid ${currentTheme.border}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'   // Pusatkan vertikal & horizontal
                    }}>
                        <div style={{
                            fontWeight: '500',
                            marginBottom: '0.75rem',
                            color: currentTheme.text,
                            alignSelf: 'flex-start'
                        }}>
                            Canvas:
                        </div>
                        <div
                            id="mycanvas"
                            style={{
                                width: '405px',         // Ukuran tetap
                                height: '405px',
                                background: theme === 'light' ? '#ffffff' : '#1a1a2e',
                                borderRadius: '0px',     // Kotak tajam
                                border: `2px solid ${currentTheme.canvasBorder}`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        ></div>
                    </div>
                </div>
            </Container>

            <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered>
                <Modal.Header closeButton style={{
                    backgroundColor: currentTheme.surface,
                    borderBottom: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text
                }}>
                    <Modal.Title>Simpan Kode Python</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ backgroundColor: currentTheme.surface, color: currentTheme.text }}>
                    <Form.Group>
                        <Form.Label>Nama file (tanpa .py)</Form.Label>
                        <Form.Control
                            type="text"
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            placeholder="my_script"
                            style={{
                                backgroundColor: currentTheme.outputBg,
                                border: `1px solid ${currentTheme.border}`,
                                color: currentTheme.text
                            }}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer style={{
                    backgroundColor: currentTheme.surface,
                    borderTop: `1px solid ${currentTheme.border}`
                }}>
                    <Button variant="secondary" onClick={() => setShowSaveModal(false)}>
                        Batal
                    </Button>
                    <Button variant="primary" onClick={() => {
                        handleSaveFile();
                        setShowSaveModal(false);
                    }}>
                        <BsDownload style={{ marginRight: '6px' }} /> Simpan
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

const ActionButton = ({ onClick, icon, label, variant, disabled }) => {
    const getStyles = () => {
        if (variant === 'primary') {
            return {
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                boxShadow: '0 2px 6px rgba(79,70,229,0.3)'
            };
        } else if (variant === 'secondary') {
            return {
                background: '#6c757d',
                color: 'white',
                border: 'none'
            };
        } else {
            return {
                background: 'transparent',
                color: '#4f46e5',
                border: '1px solid #4f46e5'
            };
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '40px',
                fontWeight: '500',
                fontSize: '0.9rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: disabled ? 0.6 : 1,
                ...getStyles()
            }}
            onMouseEnter={(e) => {
                if (!disabled && variant !== 'outline') {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
                } else if (!disabled && variant === 'outline') {
                    e.currentTarget.style.background = '#4f46e5';
                    e.currentTarget.style.color = 'white';
                }
            }}
            onMouseLeave={(e) => {
                if (variant !== 'outline') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                } else {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#4f46e5';
                }
            }}
        >
            {icon} {label}
        </button>
    );
};

export default App;