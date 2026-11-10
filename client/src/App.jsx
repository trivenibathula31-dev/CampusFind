
import React, { useEffect, useState } from "react";
import "./style.css";

const API = "https://campusfind-tzsz.onrender.com/api";
const BACKEND_URL = "https://campusfind-tzsz.onrender.com";

const emptyForm = {
  title: "",
  description: "",
  category: "Other",
  status: "Lost",
  location: "",
  date: new Date().toISOString().slice(0, 10),
  contact: ""
};

// SAFE JSON RESPONSE HANDLER
async function readResponse(response) {
  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new Error(
      "Invalid server response. Check backend logs."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error || data.message || "Something went wrong"
    );
  }

  return data;
}

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("cf_token") || ""
  );

  const [user, setUser] = useState(null);

  const [authMode, setAuthMode] = useState("login");
  const [showAuth, setShowAuth] = useState(false);

  const [auth, setAuth] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const [form, setForm] = useState(emptyForm);
  const [showReport, setShowReport] = useState(false);

  const [proofItem, setProofItem] = useState(null);
  const [proof, setProof] = useState(null);
  const [showProof, setShowProof] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  });

  // LOAD ITEMS
  async function loadItems() {
    try {
      setError("");

      const params = new URLSearchParams();

      if (filter !== "All") {
        params.set("status", filter);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(
        `${API}/items?${params}`
      );

      const data = await readResponse(response);

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Cannot connect to backend");
    }
  }

  useEffect(() => {
    loadItems();
  }, [search, filter]);

  // GET CURRENT USER
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    async function getCurrentUser() {
      try {
        const response = await fetch(`${API}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await readResponse(response);

        if (data.email) {
          setUser(data);
        } else if (data.user && data.user.email) {
          setUser(data.user);
        } else {
          logout();
        }
      } catch (err) {
        localStorage.removeItem("cf_token");
        setToken("");
        setUser(null);
      }
    }

    getCurrentUser();
  }, [token]);

  // OPEN LOGIN
  function openLogin() {
    setAuthMode("login");

    setAuth({
      name: "",
      email: "",
      password: ""
    });

    setError("");
    setMessage("");
    setShowAuth(true);
  }

  // OPEN REGISTER
  function openRegister() {
    setAuthMode("register");

    setAuth({
      name: "",
      email: "",
      password: ""
    });

    setError("");
    setMessage("");
    setShowAuth(true);
  }

  // LOGIN / REGISTER
  async function authSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${API}/auth/${authMode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(auth)
        }
      );

      const data = await readResponse(response);

      if (!data.token) {
        throw new Error(
          "Token was not received from server"
        );
      }

      localStorage.setItem("cf_token", data.token);

      setUser(data.user || null);
      setToken(data.token);

      setShowAuth(false);
      setMessage("Welcome to CampusFind!");

      setAuth({
        name: "",
        email: "",
        password: ""
      });

    } catch (err) {
      setError(err.message);
    }
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem("cf_token");

    setToken("");
    setUser(null);

    setShowAuth(false);
    setShowReport(false);
    setShowProof(false);

    setMessage("You have logged out successfully.");
    setError("");
  }

  // CREATE REPORT
  async function reportSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        `${API}/items`,
        {
          method: "POST",
          headers: headers(),
          body: JSON.stringify(form)
        }
      );

      await readResponse(response);

      setShowReport(false);
      setForm(emptyForm);
      setMessage("Report submitted successfully");

      loadItems();

    } catch (err) {
      setError(err.message);
    }
  }

  // SUBMIT PHOTO PROOF
  async function proofSubmit(e) {
    e.preventDefault();
    setError("");

    if (!proof) {
      setError("Please select photo proof");
      return;
    }

    try {
      const fd = new FormData();

      fd.append("proof", proof);

      const response = await fetch(
        `${API}/items/${proofItem}/found`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: fd
        }
      );

      const data = await readResponse(response);

      setShowProof(false);
      setProof(null);

      setMessage(
        data.emailSent
          ? "Found! Email notification sent to reporter."
          : "Found! SMTP email configuration is required."
      );

      loadItems();

    } catch (err) {
      setError(err.message);
    }
  }

  // MARK RETURNED
  async function markReturned(id) {
    try {
      const response = await fetch(
        `${API}/items/${id}/returned`,
        {
          method: "PATCH",
          headers: headers()
        }
      );

      await readResponse(response);

      setMessage("Item marked as Returned");
      loadItems();

    } catch (err) {
      setError(err.message);
    }
  }

  // DELETE REPORT
  async function deleteItem(id) {
    if (!window.confirm("Delete this report?")) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/items/${id}`,
        {
          method: "DELETE",
          headers: headers()
        }
      );

      await readResponse(response);

      setMessage("Report deleted successfully");
      loadItems();

    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">

      {/* HEADER */}
      <header>
        <div className="brand">
          <h1>⌕ CampusFind</h1>
          <p>Smart Campus Lost & Found</p>
        </div>

        <div className="headerActions">
          {!user ? (
            <>
              <button onClick={openLogin}>
                Login
              </button>

              <button onClick={openRegister}>
                Register
              </button>
            </>
          ) : (
            <>
              <span>
                Hi, {user.name || user.email}
              </span>

              <button onClick={logout}>
                Logout
              </button>

              <button
                onClick={() => {
                  setForm(emptyForm);
                  setShowReport(true);
                }}
              >
                + Report Item
              </button>
            </>
          )}
        </div>
      </header>

      <main>

        {/* HERO SECTION */}
        <section className="hero">
          <h2>
            Lost it. Found it.
            <br />
            <span>Bring it back.</span>
          </h2>

          <p>
            Report lost belongings and help
            reunite them with their owners.
          </p>

          <div className="stats">
            <div>
              <b>{items.length}</b>
              <p>Total Reports</p>
            </div>

            <div>
              <b>
                {items.filter(
                  i => i.status === "Lost"
                ).length}
              </b>
              <p>Lost Items</p>
            </div>

            <div>
              <b>
                {items.filter(
                  i => i.status === "Found"
                ).length}
              </b>
              <p>Found Items</p>
            </div>
          </div>
        </section>

        {/* SEARCH AND FILTER */}
        <section className="toolbar">
          <input
            placeholder="Search items..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option>All</option>
            <option>Lost</option>
            <option>Found</option>
            <option>Returned</option>
          </select>
        </section>

        {/* MESSAGES */}
        {error && (
          <p className="error">{error}</p>
        )}

        {message && (
          <p className="success">{message}</p>
        )}

        {/* ITEMS */}
        <section className="items">
          {items.length === 0 ? (
            <p>No items found.</p>
          ) : (
            items.map(item => (
              <article
                className="card"
                key={item._id}
              >

                <span className={`status ${item.status}`}>
                  {item.status}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>

                <p>Category: {item.category}</p>

                <p>Location: {item.location}</p>

                <p>Date: {item.date}</p>

                <p>
                  Reported by: {item.reporter?.name}
                </p>

                {item.proofUrl && (
                  <div>
                    <a
                      href={`${BACKEND_URL}${item.proofUrl}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Photo Proof
                    </a>
                  </div>
                )}

                {item.status === "Lost" &&
                  user &&
                  item.reporter?._id !== user._id && (
                    <button
                      onClick={() => {
                        setProofItem(item._id);
                        setShowProof(true);
                      }}
                    >
                      I Found This
                    </button>
                  )}

                {item.status === "Found" &&
                  user &&
                  item.reporter?._id === user._id && (
                    <button
                      onClick={() => markReturned(item._id)}
                    >
                      Mark Returned
                    </button>
                  )}

                {item.status === "Found" &&
                  item.reporter?.email && (
                    <a
                      href={
                        "mailto:" +
                        item.reporter.email +
                        "?subject=" +
                        encodeURIComponent(
                          "CampusFind: " + item.title
                        )
                      }
                    >
                      Email Reporter
                    </a>
                  )}

                {user &&
                  item.reporter?._id === user._id && (
                    <button
                      className="delete"
                      onClick={() => deleteItem(item._id)}
                    >
                      Delete Report
                    </button>
                  )}

              </article>
            ))
          )}
        </section>
      </main>

      {/* LOGIN / REGISTER POPUP */}
      {showAuth && !user && (
        <div className="modal">
          <div className="authBox">

            <button
              type="button"
              className="close-btn"
              onClick={() => setShowAuth(false)}
            >
              ✕
            </button>

            <h2>
              {authMode === "login" ? "Login" : "Register"}
            </h2>

            <form onSubmit={authSubmit}>

              {authMode === "register" && (
                <input
                  placeholder="Full Name"
                  required
                  value={auth.name}
                  onChange={e =>
                    setAuth({
                      ...auth,
                      name: e.target.value
                    })
                  }
                />
              )}

              <input
                type="email"
                placeholder="Email"
                required
                value={auth.email}
                onChange={e =>
                  setAuth({
                    ...auth,
                    email: e.target.value
                  })
                }
              />

              <input
                type="password"
                placeholder="Password (minimum 6)"
                minLength="6"
                required
                value={auth.password}
                onChange={e =>
                  setAuth({
                    ...auth,
                    password: e.target.value
                  })
                }
              />

              <button type="submit">
                {authMode === "login"
                  ? "Login"
                  : "Create Account"}
              </button>

            </form>

            <p>
              {authMode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>

            <button
              type="button"
              onClick={() => {
                setAuthMode(
                  authMode === "login"
                    ? "register"
                    : "login"
                );
                setError("");
              }}
            >
              {authMode === "login"
                ? "Register"
                : "Login"}
            </button>

          </div>
        </div>
      )}

      {/* REPORT ITEM FORM */}
      {showReport && (
        <div className="modal">
          <form onSubmit={reportSubmit}>
            <h2>Report an Item</h2>

            <input
              placeholder="Item Name"
              required
              value={form.title}
              onChange={e =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
            />

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={e =>
                setForm({
                  ...form,
                  description: e.target.value
                })
              }
            />

            <select
              value={form.category}
              onChange={e =>
                setForm({
                  ...form,
                  category: e.target.value
                })
              }
            >
              <option>Other</option>
              <option>Electronics</option>
              <option>Books</option>
              <option>Clothing</option>
              <option>Accessories</option>
              <option>Documents</option>
            </select>

            <select
              value={form.status}
              onChange={e =>
                setForm({
                  ...form,
                  status: e.target.value
                })
              }
            >
              <option>Lost</option>
              <option>Found</option>
            </select>

            <input
              placeholder="Location"
              required
              value={form.location}
              onChange={e =>
                setForm({
                  ...form,
                  location: e.target.value
                })
              }
            />

            <input
              type="date"
              value={form.date}
              onChange={e =>
                setForm({
                  ...form,
                  date: e.target.value
                })
              }
            />

            <input
              type="email"
              placeholder="Contact Email"
              required
              value={form.contact}
              onChange={e =>
                setForm({
                  ...form,
                  contact: e.target.value
                })
              }
            />

            <button type="submit">
              Submit Report
            </button>

            <button
              type="button"
              onClick={() => setShowReport(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* FOUND PROOF FORM */}
      {showProof && (
        <div className="modal">
          <form onSubmit={proofSubmit}>
            <h2>Upload Found Proof</h2>

            <p>
              Upload a photo of the item you have found.
            </p>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              onChange={e =>
                setProof(e.target.files[0])
              }
            />

            <button type="submit">
              Submit Proof & Notify Reporter
            </button>

            <button
              type="button"
              onClick={() => setShowProof(false)}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

    </div>
  );
}