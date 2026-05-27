import React, { useEffect, useMemo, useRef, useState } from "react";
import html2pdf from "html2pdf.js";

export default function PlanningObjectionApp() {
  const councilEmail = "angela.leckie@manchester.gov.uk,planning@manchester.gov.uk";

  const [planningRef, setPlanningRef] = useState("14259/VO/2025");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [relationship, setRelationship] = useState("I am a patron/supporter of Stage & Radio.");
  const [otherRelationship, setOtherRelationship] = useState("");
  const [extraComments, setExtraComments] = useState("");
  const [letterDate, setLetterDate] = useState(new Date().toISOString().slice(0, 10));
  const [signature, setSignature] = useState("");
  const [signatureMode, setSignatureMode] = useState("draw");
  const [drawnSignature, setDrawnSignature] = useState("");
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(new Date());

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const deadline = new Date("2026-06-09T23:59:59");
  const timeRemaining = Math.max(0, deadline - now);
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);

  const activeRelationship = relationship === "Other" ? otherRelationship : relationship;

  const isFormComplete = Boolean(
    planningRef.trim() &&
      letterDate.trim() &&
      name.trim() &&
      address.trim() &&
      extraComments.trim() &&
      activeRelationship.trim() &&
      (signatureMode === "type" ? signature.trim() : drawnSignature)
  );

  const fieldClass = "mt-2 w-full border border-neutral-300 bg-white px-3 py-3 text-base text-neutral-950 focus:border-neutral-950 focus:outline-none";
  const labelClass = "block text-sm font-semibold text-neutral-950";
  const buttonClass = "w-full border px-4 py-3 text-sm font-bold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40";

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event) => {
    if (signatureMode !== "draw") return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(event);
    isDrawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const drawSignature = (event) => {
    if (!isDrawingRef.current || signatureMode !== "draw") return;
    event.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const point = getCanvasPoint(event);
    ctx.lineTo(point.x, point.y);
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDrawnSignature(canvas.toDataURL("image/png"));
  };

  const clearDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature("");
  };

  const formattedDate = useMemo(() => {
    if (!letterDate) return "[DATE]";
    return new Date(letterDate).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, [letterDate]);

  const subject = `Representation regarding Planning Application ${planningRef} – Proposed Residential Development Next to Stage & Radio`;

  const personalCommentsText =
    extraComments ||
    `WE ADVISE WRITING THIS SECTION FROM YOUR OWN PERSONAL PERSPECTIVE.\n\n• Individual and genuine representations typically carry significantly more weight than copied responses.\n\n• We advise focusing primarily on concerns around whether residential units directly beside an established late-night venue can realistically provide appropriate residential amenity and conditions suitable for long-term human habitation.\n\n• You may also wish to explain your personal experiences with Stage & Radio, why independent music venues matter to you, or broader concerns about Manchester's nightlife and cultural infrastructure.\n\n• We also advise keeping comments calm, factual, respectful and non-aggressive.`;

  const typedSignatureText = signature || name || "[YOUR SIGNATURE]";

  const emailLetter = useMemo(() => {
    return `${formattedDate}\n\nTo: Manchester City Council Planning Department\nFor the attention of: Angela Leckie\n\nSubject: Representation regarding Planning Application ${planningRef}\n\nDear Ms Leckie,\n\nI am writing formally in regards to the proposed residential development of 126 flats next to Stage & Radio, a long-standing grassroots music venue in Manchester.\n\n${name ? `My name is ${name}. ` : ""}${address ? `My address is ${address}. ` : ""}${activeRelationship}\n\nI am deeply concerned about whether this development can realistically provide appropriate residential amenity and conditions suitable for long-term human habitation beside an established late-night music venue, while also protecting Stage & Radio and Manchester’s wider cultural and night-time economy.\n\n${personalCommentsText}\n\nIn addition to my personal concerns, I would also like the Council to consider the following key issues:\n\n• The likelihood that residential units immediately beside an established late-night music venue may be unable to provide appropriate residential amenity and could raise serious concerns around long-term human habitation\n• The importance of properly applying the Agent of Change principle\n• The ongoing national loss of grassroots music venues due to residential development pressures\n• The cultural importance of independent venues to Manchester's identity, artists and night-time economy\n\nPlease register this as a objection to the application.\n\nYours sincerely,\n\n${signatureMode === "type" ? typedSignatureText : drawnSignature ? "[DRAWN SIGNATURE INCLUDED IN PDF]" : "[DRAW SIGNATURE]"}\n${name || "[FULL NAME]"}`;
  }, [formattedDate, planningRef, name, address, activeRelationship, personalCommentsText, signatureMode, typedSignatureText, drawnSignature]);

  const copyLetter = async () => {
    if (!isFormComplete) return;
    await navigator.clipboard.writeText(emailLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const exportPdf = () => {
    if (!isFormComplete) return;
    const element = document.getElementById("letter-preview");
    if (!element) return;

    const filename = `planning-representation-${planningRef.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.pdf`;

    html2pdf()
      .set({
        margin: [12, 12, 12, 12],
        filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .from(element)
      .save();
  };

  const openEmail = async () => {
    if (!isFormComplete) return;

    const emailBodyWithoutSignature = `Dear Ms Leckie,\n\nI am writing formally in regards to the proposed residential development of 126 flats next to Stage & Radio, a long-standing grassroots music venue in Manchester.\n\n${name ? `My name is ${name}. ` : ""}${address ? `My address is ${address}. ` : ""}${activeRelationship}\n\nI am deeply concerned about whether this development can realistically provide appropriate residential amenity and conditions suitable for long-term human habitation beside an established late-night music venue, while also protecting Stage & Radio and Manchester’s wider cultural and night-time economy.\n\n${personalCommentsText}\n\nIn addition to my personal concerns, I would also like the Council to consider the following key issues:\n\n• The likelihood that residential units immediately beside an established late-night music venue may be unable to provide appropriate residential amenity and could raise serious concerns around long-term human habitation\n• The importance of properly applying the Agent of Change principle\n• The ongoing national loss of grassroots music venues due to residential development pressures\n• The cultural importance of independent venues to Manchester's identity, artists and night-time economy\n\nPlease register this as an objection to the application.\n\nKind regards,\n\n${name}\n${formattedDate}`;

    const isMobileDevice = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);

    let emailBody = emailBodyWithoutSignature;

    if (isMobileDevice) {
      try {
        await navigator.clipboard.writeText(emailBodyWithoutSignature);
      } catch (error) {
        console.warn("Could not copy email body automatically", error);
      }

      emailBody = `Dear Ms Leckie,\n\nPlease see my representation regarding Planning Application ${planningRef}.\n\nIf the full representation text has not appeared below, I have copied it and will paste it into this email before sending.\n\nKind regards,\n\n${name}`;
    }

    const mailto = `mailto:${councilEmail}?cc=${encodeURIComponent("advancing@stageandradio.co.uk")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

    if (window.top) {
      window.top.location.href = mailto;
    } else {
      window.location.href = mailto;
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 px-3 py-4 text-white sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <section className="space-y-3">
          <div className="inline-block border border-red-700 bg-red-950 px-3 py-3 text-xs font-bold uppercase tracking-wide text-red-100 sm:px-4 sm:text-sm">
            Representation deadline – 9 June 2026 • {days} days {hours} hours {minutes} minutes remaining
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:items-start">
          <section className="border border-neutral-200 bg-white text-neutral-950 shadow-xl">
            <div className="space-y-5 p-4 sm:p-6">
              <div className="pb-2">
                <a
                  href="https://www.gmmusiccommission.co.uk/resources/planning-a-practical-guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonClass} border-green-700 bg-green-700 text-white hover:border-green-600 hover:bg-green-600`}
                >
                  Writing a strong representation guide
                  <span className="transition-transform group-hover:translate-x-1">↗</span>
                </a>
              </div>

              <div>
                <label className={labelClass}>Planning application reference *</label>
                <input value={planningRef} onChange={(e) => setPlanningRef(e.target.value)} className={fieldClass} required />
              </div>

              <div>
                <label className={labelClass}>Date of letter *</label>
                <input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} className={fieldClass} required />
              </div>

              <div>
                <label className={labelClass}>Your full name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Smith" className={fieldClass} required />
              </div>

              <div>
                <label className={labelClass}>Your address or postcode *</label>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="This helps the council verify local comments" className={fieldClass} required />
              </div>

              <div>
                <label className={labelClass}>Your connection to the venue *</label>
                <select value={relationship} onChange={(e) => setRelationship(e.target.value)} className={fieldClass} required>
                  <option>I am a patron/supporter of Stage & Radio.</option>
                  <option>I am a local resident.</option>
                  <option>I am an artist, DJ, musician or performer.</option>
                  <option>I am a promoter or event organiser.</option>
                  <option>I work in Manchester's night-time or cultural economy.</option>
                  <option>I am a member of the general public who values grassroots music venues.</option>
                  <option>Other</option>
                </select>
                {relationship === "Other" && (
                  <input value={otherRelationship} onChange={(e) => setOtherRelationship(e.target.value)} placeholder="Please describe your connection" className={fieldClass} required />
                )}
              </div>

              <div>
                <label className={labelClass}>Add your own comments *</label>
                <textarea
                  value={extraComments}
                  onChange={(e) => setExtraComments(e.target.value)}
                  placeholder="We advise writing from your own personal perspective, particularly around concerns of residential amenity and long-term human habitation beside an established late-night venue. Genuine representations generally carry more weight than copied responses. We also advise keeping comments calm, respectful, factual and non-aggressive."
                  rows={8}
                  className={`${fieldClass} min-h-40 resize-y`}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className={labelClass}>Signature *</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setSignatureMode("draw")} className={`${buttonClass} ${signatureMode === "draw" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-neutral-100 text-neutral-950"}`}>
                    Draw signature
                  </button>
                  <button type="button" onClick={() => setSignatureMode("type")} className={`${buttonClass} ${signatureMode === "type" ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-300 bg-neutral-100 text-neutral-950"}`}>
                    Type signature
                  </button>
                </div>

                {signatureMode === "draw" ? (
                  <div className="space-y-2">
                    <canvas
                      ref={canvasRef}
                      width={700}
                      height={220}
                      onMouseDown={startDrawing}
                      onMouseMove={drawSignature}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={drawSignature}
                      onTouchEnd={stopDrawing}
                      className="h-40 w-full touch-none border border-neutral-300 bg-white cursor-crosshair sm:h-48"
                    />
                    <button type="button" onClick={clearDrawnSignature} className={`${buttonClass} border-neutral-300 bg-neutral-100 text-neutral-950`}>
                      Clear signature
                    </button>
                  </div>
                ) : (
                  <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Type your signature" className={fieldClass} required />
                )}
              </div>

              {!isFormComplete && <p className="text-sm font-semibold text-red-700">Please complete all required fields before copying, exporting or emailing.</p>}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button type="button" onClick={copyLetter} disabled={!isFormComplete} className={`${buttonClass} border-neutral-950 bg-neutral-950 text-white`}>
                  {copied ? "Copied" : "Copy"}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
                <button type="button" onClick={exportPdf} disabled={!isFormComplete} className={`${buttonClass} border-neutral-950 bg-neutral-950 text-white`}>
                  PDF
                  <span className="transition-transform group-hover:translate-y-0.5">↓</span>
                </button>
                <button type="button" onClick={openEmail} disabled={!isFormComplete} className={`${buttonClass} border-yellow-400 bg-yellow-400 text-neutral-950`}>
                  Email
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </button>
              </div>

              

              <p className="text-sm text-neutral-600">Email opens to: {councilEmail}. Please check the planning reference before sending.</p>
            </div>
          </section>

          <section className="border border-neutral-200 bg-white text-neutral-950 shadow-xl">
            <div className="p-4 sm:p-6">
              <h2 className="mb-4 text-xl font-bold">Letter preview</h2>

              <div id="letter-preview" className="bg-white p-4 text-left text-sm leading-7 text-black sm:p-8 sm:text-base">
                <p>{formattedDate}</p>

                <p className="mt-4">
                  To: Manchester City Council Planning Department
                  <br />
                  For the attention of: Angela Leckie
                </p>

                <p className="mt-4 font-semibold">Subject: Representation regarding Planning Application {planningRef}</p>

                <p className="mt-4">Dear Ms Leckie,</p>

                <p className="mt-4">I am writing formally in regards to the proposed residential development of 126 flats next to Stage & Radio, a long-standing grassroots music venue in Manchester.</p>

                <p className="mt-4">
                  {name ? `My name is ${name}. ` : ""}
                  {address ? `My address is ${address}. ` : ""}
                  {activeRelationship}
                </p>

                <p className="mt-4">I am deeply concerned about whether this development can realistically provide appropriate residential amenity and conditions suitable for long-term human habitation beside an established late-night music venue, while also protecting Stage & Radio and Manchester’s wider cultural and night-time economy.</p>

                <div className={`mt-4 whitespace-pre-wrap ${extraComments ? "" : "font-semibold text-red-700"}`}>{personalCommentsText}</div>

                <p className="mt-4">In addition to my personal concerns, I would also like the Council to consider the following key issues:</p>

                <ul className="mt-3 list-disc space-y-2 pl-6">
                  <li>The likelihood that residential units immediately beside an established late-night music venue may be unable to provide appropriate residential amenity and could raise serious concerns around long-term human habitation</li>
                  <li>The importance of properly applying the Agent of Change principle</li>
                  <li>The ongoing national loss of grassroots music venues due to residential development pressures</li>
                  <li>The cultural importance of independent venues to Manchester's identity, artists and night-time economy</li>
                </ul>

                <p className="mt-4">Please register this as a objection to the application.</p>
                <p className="mt-4">Yours sincerely,</p>

                {signatureMode === "draw" ? (
                  <div className="mt-4">
                    {drawnSignature ? <img src={drawnSignature} alt="Drawn signature" className="h-20 object-contain" /> : <p>[DRAW SIGNATURE]</p>}
                    <p className="mt-1">{name || "[FULL NAME]"}</p>
                  </div>
                ) : (
                  <div className="mt-4 whitespace-pre-wrap">
                    <p>{typedSignatureText}</p>
                    <p>{name || "[FULL NAME]"}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
