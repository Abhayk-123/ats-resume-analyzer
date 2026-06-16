import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FileText, Target, CheckCircle, AlertTriangle, Sparkles, Upload, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import './style.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const SKILL_BANK = [
  'java','javascript','python','react','node','express','spring','spring boot','html','css','sql','mysql','mongodb','firebase','git','github','api','rest api','dsa','oop','system design','aws','docker','typescript','next.js','tailwind','machine learning','gen ai','ai','vercel','figma','ui/ux'
];

const STOP_WORDS = new Set(['the','and','for','with','you','your','are','this','that','from','have','will','shall','can','our','job','role','work','team','into','using','use','has','was','were','their','about','more','also','must','good','strong','able','etc','not','all','any','one','two','to','of','in','on','a','an','is','as','by','or','be','we']);

function normalize(text){ return text.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g,' '); }
function words(text){ return normalize(text).split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)); }
function extractSkills(text){
  const clean = normalize(text);
  return SKILL_BANK.filter(skill => clean.includes(skill));
}
function topKeywords(text, limit=18){
  const counts = {};
  words(text).forEach(w => counts[w] = (counts[w] || 0) + 1);
  return Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([w])=>w);
}

async function readPdfText(file){
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';

  for(let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++){
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    text += pageText + '\n';
  }

  return text.trim();
}

function App(){
  const [resume, setResume] = useState('');
  const [jd, setJd] = useState('');
  const [fileName, setFileName] = useState('No PDF uploaded');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState('');

  const handlePdfUpload = async (event) => {
    const file = event.target.files?.[0];
    if(!file) return;

    if(file.type !== 'application/pdf'){
      setPdfError('Please upload a valid PDF resume.');
      return;
    }

    try{
      setPdfError('');
      setLoadingPdf(true);
      setFileName(file.name);
      const text = await readPdfText(file);
      if(!text){
        setPdfError('Could not read text from this PDF. Try a text-based resume PDF, not a scanned image.');
      }
      setResume(text);
    }catch(error){
      console.error(error);
      setPdfError('PDF reading failed. Please try another resume PDF.');
    }finally{
      setLoadingPdf(false);
    }
  };

  const result = useMemo(() => {
    const resumeSkills = extractSkills(resume);
    const jdSkills = extractSkills(jd);
    const jdKeys = topKeywords(jd);
    const resumeClean = normalize(resume);

    const matchedSkills = jdSkills.filter(s => resumeSkills.includes(s));
    const missingSkills = jdSkills.filter(s => !resumeSkills.includes(s));
    const matchedKeywords = jdKeys.filter(k => resumeClean.includes(k));
    const missingKeywords = jdKeys.filter(k => !resumeClean.includes(k));

    const skillScore = jdSkills.length ? (matchedSkills.length / jdSkills.length) * 60 : 25;
    const keywordScore = jdKeys.length ? (matchedKeywords.length / jdKeys.length) * 30 : 15;
    const lengthScore = resume.trim().length > 400 ? 10 : resume.trim().length > 150 ? 6 : 2;
    const score = Math.min(100, Math.round(skillScore + keywordScore + lengthScore));

    let level = 'Needs Improvement';
    if(score >= 80) level = 'Strong Match';
    else if(score >= 60) level = 'Good Match';
    else if(score >= 40) level = 'Average Match';

    const tips = [];
    if(missingSkills.length) tips.push(`Add missing technical skills naturally: ${missingSkills.slice(0,6).join(', ')}.`);
    if(missingKeywords.length) tips.push(`Use job-related keywords: ${missingKeywords.slice(0,6).join(', ')}.`);
    if(resume.trim().length < 400) tips.push('Add project impact, tools used, and measurable achievements.');
    if(!resumeClean.includes('project')) tips.push('Include at least one project section with live/GitHub link.');
    if(!resumeClean.includes('experience') && !resumeClean.includes('internship')) tips.push('Mention internship, training, or practical experience if available.');

    return {score, level, matchedSkills, missingSkills, tips: tips.length ? tips : ['Your resume is well aligned. Keep it clear, specific, and achievement-focused.']};
  }, [resume, jd]);

  const sample = () => {
    setResume('Abhay Kumar - Java Developer. Skills: Java, JavaScript, React, Node, REST API, MongoDB, Firebase, Git, GitHub, DSA, OOP. Projects: SkillScan AI resume analyzer, StudyAgent AI, TufRun mobile app. Built full-stack applications with authentication, dashboard and API integration.');
    setJd('We are hiring a Full Stack Developer with strong JavaScript, React, Node.js, REST API, MongoDB, GitHub, UI/UX basics, problem solving, DSA, and experience building production-ready web apps.');
    setFileName('Sample resume loaded');
    setPdfError('');
  };

  const clearAll = () => { setResume(''); setJd(''); setFileName('No PDF uploaded'); setPdfError(''); };

  return <div className="page">
    <header className="hero">
      <div>
        <p className="badge"><Sparkles size={16}/> Free Online Tool</p>
        <h1>ATS Resume Analyzer Lite</h1>
        <p className="subtitle">Upload your resume PDF and paste a job description to get an instant ATS-style match score, missing skills, and improvement tips.</p>
      </div>
      <div className="owner">
        <b>Built by:</b> Abhay Kumar<br/>
        <b>Email:</b> 2023nitsgr184@nitsri.ac.in
      </div>
    </header>

    <main className="grid">
      <section className="card input-card">
        <h2><FileText size={20}/> Resume PDF Reader</h2>
        <label className="upload-box">
          <Upload size={28}/>
          <span>{loadingPdf ? 'Reading PDF...' : 'Click to upload resume PDF'}</span>
          <small>{fileName}</small>
          <input type="file" accept="application/pdf" onChange={handlePdfUpload}/>
        </label>
        {loadingPdf && <p className="status"><Loader2 size={16}/> Extracting resume text from PDF...</p>}
        {pdfError && <p className="error">{pdfError}</p>}
        <textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Extracted resume text will appear here after PDF upload..."></textarea>
      </section>

      <section className="card input-card">
        <h2><Target size={20}/> Job Description</h2>
        <textarea value={jd} onChange={e=>setJd(e.target.value)} placeholder="Paste the job description here..."></textarea>
      </section>
    </main>

    <div className="actions">
      <button onClick={sample}>Try Sample</button>
      <button className="secondary" onClick={clearAll}>Clear</button>
      <a className="dh" href="https://digitalheroesco.com" target="_blank" rel="noreferrer">Built for Digital Heroes</a>
    </div>

    <section className="card results">
      <div className="score-box">
        <div className="score">{resume || jd ? result.score : 0}%</div>
        <div>
          <h2>{resume || jd ? result.level : 'Start Analysis'}</h2>
          <p>ATS match score based on skills, keywords, and resume completeness.</p>
        </div>
      </div>

      <div className="result-grid">
        <div>
          <h3><CheckCircle size={18}/> Matched Skills</h3>
          <div className="chips">{result.matchedSkills.length ? result.matchedSkills.map(x=><span key={x}>{x}</span>) : <em>No matched skills yet</em>}</div>
        </div>
        <div>
          <h3><AlertTriangle size={18}/> Missing Skills</h3>
          <div className="chips warn">{result.missingSkills.length ? result.missingSkills.map(x=><span key={x}>{x}</span>) : <em>No missing skills detected</em>}</div>
        </div>
      </div>

      <h3>Improvement Tips</h3>
      <ul>{result.tips.map((tip,i)=><li key={i}>{tip}</li>)}</ul>
    </section>

    <footer>
      <p>This tool is free, works in browser, reads text-based resume PDFs, and gives real output instantly. No paid API is used.</p>
    </footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);
