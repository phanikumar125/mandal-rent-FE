"use client";

import Image from "next/image";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { marketplaceListings, productCopy } from "../_data/product";
import { useLanguage } from "./language-toggle";
import { MobileBottomNav, ProductHeader } from "./product-shell";

type BookingStatus = "draft" | "requested" | "accepted" | "paid" | "rejected";
type ChatMessage = {
  id: number;
  sender: "farmer" | "owner";
  text: string;
  time: string;
};

export default function BookingExperience() {
  const { language } = useLanguage();
  const copy = productCopy[language];
  const listing = marketplaceListings[0];
  const [date, setDate] = useState("2026-08-18");
  const [time, setTime] = useState("07:00");
  const [days, setDays] = useState(1);
  const [status, setStatus] = useState<BookingStatus>("draft");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: "farmer" as const, text: copy.farmerMessage, time: "10:15 AM" },
    { id: 2, sender: "owner" as const, text: copy.ownerMessage, time: "10:17 AM" },
  ]);

  const totals = useMemo(() => {
    const rent = listing.price * days;
    const serviceFee = Math.round(rent * 0.05);
    const total = rent + serviceFee;
    const ownerReceives = Math.round(total * 0.9);
    return { rent, serviceFee, total, ownerReceives };
  }, [days, listing.price]);

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), sender: "farmer", text: trimmed, time: "Now" },
    ]);
    setMessage("");
  }

  const activeStep = status === "paid" ? 3 : status === "accepted" ? 2 : status === "requested" ? 1 : 0;

  return (
    <div className="booking-root">
      <ProductHeader activeVersion="v2" />
      <main className="booking-main">
        <section className="booking-product">
          <div className="booking-product-summary">
            <Image
              src={listing.image}
              alt={listing.imageAlt[language]}
              width={720}
              height={540}
              priority
              sizes="(max-width: 900px) 100vw, 42vw"
            />
            <div className="booking-product-copy">
              <h1>{listing.title}</h1>
              <p className="booking-price">₹{listing.price.toLocaleString("en-IN")} <span>/ {listing.unit[language]}</span></p>
              <p className="booking-location"><MapPin size={19} /> {listing.mandal} • {listing.village}</p>
              <p className="booking-owner"><ShieldCheck size={21} /> {listing.owner} <span>{copy.verifiedOwner}</span></p>
              <div className="booking-product-actions">
                <a href="#chat"><MessageCircle size={20} /> {copy.chat}</a>
                <a href="#booking-panel"><CalendarDays size={20} /> {copy.startBooking}</a>
              </div>
            </div>
          </div>

          <section className="chat-panel" id="chat" aria-labelledby="chat-title">
            <div className="chat-heading">
              <div><MessageCircle size={23} /><h2 id="chat-title">{copy.chat}</h2></div>
              <span><i aria-hidden="true" /> {language === "te" ? "ఆన్‌లైన్" : "Online"}</span>
            </div>
            <div className="chat-messages" aria-live="polite">
              {messages.map((item) => (
                <div key={item.id} className={`chat-message is-${item.sender}`}>
                  {item.sender === "owner" ? <span className="owner-avatar"><UserRound size={19} /></span> : null}
                  <p>{item.text}<small>{item.time}{item.sender === "farmer" ? <Check size={14} /> : null}</small></p>
                </div>
              ))}
            </div>
            <form className="chat-composer" onSubmit={sendMessage}>
              <label htmlFor="chat-message" className="sr-only">{copy.messagePlaceholder}</label>
              <input id="chat-message" value={message} onChange={(event) => setMessage(event.target.value)} placeholder={copy.messagePlaceholder} />
              <button type="submit" aria-label={copy.send}><Send size={21} /></button>
            </form>
          </section>

          <section className="owner-request-panel" aria-live="polite">
            <div className="owner-request-title">
              <span><CalendarDays size={22} /></span>
              <div><h2>{copy.newBooking}</h2><p>{date} • {time} • {days} {language === "te" ? "రోజు" : days === 1 ? "day" : "days"}</p></div>
            </div>
            <div className="owner-request-equipment">
              <Image src={listing.image} alt="" width={180} height={135} />
              <div><strong>{listing.title}</strong><span>{listing.mandal} • {listing.village}</span></div>
            </div>
            <div className="owner-payout"><span>{copy.ownerReceives}</span><strong>₹{totals.ownerReceives.toLocaleString("en-IN")}</strong></div>
            <div className="owner-decision-actions">
              <button type="button" onClick={() => setStatus("accepted")} className={status === "accepted" ? "is-selected" : undefined}>
                <CheckCircle2 size={19} /> {copy.accept}
              </button>
              <button type="button" onClick={() => setStatus("rejected")} className={status === "rejected" ? "is-selected" : undefined}>
                <XCircle size={19} /> {copy.reject}
              </button>
            </div>
          </section>
        </section>

        <aside className="booking-panel" id="booking-panel">
          <div className="booking-panel-heading"><CalendarDays size={24} /><h2>{copy.bookingTitle}</h2></div>
          <ol className="booking-steps">
            {[copy.request, copy.ownerAccept, copy.payment, copy.complete].map((label, index) => (
              <li key={label} className={index <= activeStep ? "is-active" : undefined}>
                <span>{index < activeStep ? <Check size={16} /> : index + 1}</span><small>{label}</small>
              </li>
            ))}
          </ol>

          <div className="booking-fields">
            <label><span>{copy.date}</span><div><CalendarDays size={18} /><input type="date" value={date} min="2026-08-17" onChange={(event) => setDate(event.target.value)} /></div></label>
            <label><span>{copy.time}</span><div><Clock3 size={18} /><input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div></label>
            <label><span>{copy.duration}</span><select value={days} onChange={(event) => setDays(Number(event.target.value))}><option value={1}>{copy.oneDay}</option><option value={2}>{copy.twoDays}</option><option value={3}>{copy.threeDays}</option></select></label>
          </div>

          <dl className="price-summary">
            <div><dt>{copy.rent}</dt><dd>₹{totals.rent.toLocaleString("en-IN")}</dd></div>
            <div><dt>{copy.serviceFee}</dt><dd>₹{totals.serviceFee.toLocaleString("en-IN")}</dd></div>
            <div><dt>{copy.total}</dt><dd>₹{totals.total.toLocaleString("en-IN")}</dd></div>
          </dl>

          <p className="booking-trust"><ShieldCheck size={20} /> {copy.trust}</p>

          {status === "draft" ? (
            <button type="button" className="booking-request-button" onClick={() => setStatus("requested")}>
              <CalendarDays size={20} /> {copy.startBooking}
            </button>
          ) : (
            <button
              type="button"
              className="payment-button"
              disabled={status !== "accepted"}
              onClick={() => setStatus("paid")}
            >
              {status === "paid" ? <CheckCircle2 size={22} /> : <LockKeyhole size={21} />}
              {status === "paid" ? copy.paymentReady : `₹${totals.total.toLocaleString("en-IN")} ${copy.pay}`}
            </button>
          )}

          {status === "requested" ? <p className="booking-status-note">{copy.bookingSent}</p> : null}
          {status === "rejected" ? <p className="booking-status-note is-error">{language === "te" ? "యజమాని ఈ సమయాన్ని తిరస్కరించారు. మరో సమయం ఎంచుకోండి." : "The owner declined this slot. Choose another time."}</p> : null}

          <div className="trust-row">
            <span><ShieldCheck size={18} /> {language === "te" ? "సురక్షిత చెల్లింపు" : "Secure payment"}</span>
            <span><MessageCircle size={18} /> {language === "te" ? "సహాయం అందుబాటులో ఉంది" : "Help available"}</span>
          </div>
        </aside>
      </main>
      <MobileBottomNav active="discover" />
    </div>
  );
}
