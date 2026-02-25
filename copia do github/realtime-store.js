(function () {
  "use strict";

  const DATA_KEY = "imtsb_realtime_data_v1";
  const SESSION_KEY = "imtsb_session_v1";

  function nowIso() {
    return new Date().toISOString();
  }

  function seedData() {
    return {
      updatedAt: nowIso(),
      counterNormal: 0,
      counterPriority: 0,
      currentTicketId: null,
      lastCalled: null,
      users: [
        { id: "u-admin-1", name: "Administrador 1", email: "admin1@sb.com", password: "Admin1234", role: "admin" },
        { id: "u-admin-2", name: "Administrador 2", email: "admin2@sb.com", password: "Admin2234", role: "admin" },
        { id: "u-worker-1", name: "Trabalhador 1", email: "trabalhador@sb.com", password: "Trab12345", role: "trabalhador", department: "Secretaria" },
        { id: "u-user-1", name: "Usuario 1", email: "usuario@sb.com", password: "User12345", role: "usuario" }
      ],
      queue: [],
      history: []
    };
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readData() {
    const raw = localStorage.getItem(DATA_KEY);
    if (!raw) {
      const data = seedData();
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return data;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") throw new Error("invalid");
      if (!Array.isArray(parsed.users)) parsed.users = [];
      if (!Array.isArray(parsed.queue)) parsed.queue = [];
      if (!Array.isArray(parsed.history)) parsed.history = [];
      if (typeof parsed.counterNormal !== "number") {
        parsed.counterNormal = typeof parsed.counter === "number" ? parsed.counter : 0;
      }
      if (typeof parsed.counterPriority !== "number") parsed.counterPriority = 0;
      if (!Object.prototype.hasOwnProperty.call(parsed, "currentTicketId")) parsed.currentTicketId = null;
      return parsed;
    } catch (_error) {
      const data = seedData();
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return data;
    }
  }

  function writeData(data) {
    data.updatedAt = nowIso();
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("imtsb:data-changed"));
  }

  function updateData(mutator) {
    const data = readData();
    const result = mutator(data);
    writeData(data);
    return result;
  }

  function getSession() {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch (_error) {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      email: user.email,
      name: user.name,
      role: user.role,
      loggedAt: nowIso()
    }));
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function nextCode(counter, prefix) {
    const value = counter + 1;
    const padded = String(value).padStart(3, "0");
    return { counter: value, code: `${prefix}${padded}` };
  }

  function findTicketById(data, ticketId) {
    const inQueue = data.queue.find((item) => item.id === ticketId);
    if (inQueue) return inQueue;

    const inHistory = data.history.find((item) => item.id === ticketId);
    if (inHistory) return inHistory;

    return null;
  }

  const store = {
    dataKey: DATA_KEY,
    apiEnabled: !!(window.IMTSBApiConfig && window.IMTSBApiConfig.enabled),
    apiConfig: window.IMTSBApiConfig || null,
    apiClient: window.IMTSBApiClient || null,

    ensureSeed() {
      readData();
    },

    onChange(handler) {
      const wrapped = () => handler();
      window.addEventListener("imtsb:data-changed", wrapped);
      window.addEventListener("storage", (event) => {
        if (event.key === DATA_KEY) handler();
      });
      return () => window.removeEventListener("imtsb:data-changed", wrapped);
    },

    getSnapshot() {
      return clone(readData());
    },

    getSession,

    requireRole(roles) {
      const session = getSession();
      if (!session || !roles.includes(session.role)) {
        window.location.href = "logintcc.html";
        return null;
      }
      return session;
    },

    logout() {
      clearSession();
      window.location.href = "logintcc.html";
    },

    login(email, password, selectedRole) {
      const normalized = normalizeEmail(email);
      const typedPassword = String(password || "");

      const data = readData();
      const user = data.users.find((item) => item.email === normalized);

      if (!user) {
        return { ok: false, message: "Conta nao encontrada. Faça o cadastro." };
      }

      if (user.password !== typedPassword) {
        return { ok: false, message: "Senha incorreta." };
      }

      if (selectedRole && user.role !== selectedRole) {
        return { ok: false, message: "O perfil selecionado nao corresponde a esta conta." };
      }

      setSession(user);

      return {
        ok: true,
        user: { name: user.name, role: user.role, email: user.email },
        redirect: user.role === "admin" ? "dashadm.html" : (user.role === "trabalhador" ? "dashtrabalho.html" : "dashusuario.html")
      };
    },

    register(payload) {
      const name = String(payload.name || "").trim();
      const email = normalizeEmail(payload.email);
      const password = String(payload.password || "");
      const role = "usuario";

      if (name.length < 3) return { ok: false, message: "Nome deve ter pelo menos 3 caracteres." };
      if (!email.includes("@")) return { ok: false, message: "Email invalido." };
      if (password.length < 6) return { ok: false, message: "Senha deve ter pelo menos 6 caracteres." };

      return updateData((data) => {
        if (data.users.some((item) => item.email === email)) {
          return { ok: false, message: "Ja existe conta com este email." };
        }

        data.users.push({
          id: `u-${Date.now()}`,
          name,
          email,
          password,
          role
        });

        return { ok: true, message: "Conta criada com sucesso." };
      });
    },

    addWorker(payload) {
      const name = String(payload.name || "").trim();
      const email = normalizeEmail(payload.email);
      const password = String(payload.password || "");
      const department = String(payload.department || "").trim() || "Outro";

      if (name.length < 3) return { ok: false, message: "Nome deve ter pelo menos 3 caracteres." };
      if (!email.includes("@")) return { ok: false, message: "Email invalido." };
      if (password.length < 6) return { ok: false, message: "Senha deve ter pelo menos 6 caracteres." };

      return updateData((data) => {
        if (data.users.some((item) => item.email === email)) {
          return { ok: false, message: "Ja existe conta com este email." };
        }

        data.users.push({
          id: `u-${Date.now()}`,
          name,
          email,
          password,
          role: "trabalhador",
          department
        });

        return { ok: true, message: "Trabalhador adicionado com sucesso." };
      });
    },

    issueTicket(payload) {
      const service = String(payload.service || "").trim();
      const userEmail = normalizeEmail(payload.userEmail);
      const userName = String(payload.userName || "").trim() || "Usuario";
      const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

      if (!service) return { ok: false, message: "Selecione um servico." };

      return updateData((data) => {
        const serviceKey = service.toLowerCase();
        const isPriority = serviceKey === "pedido de declaracao" || serviceKey === "senhas prioritarias";
        const next = isPriority
          ? nextCode(data.counterPriority, "P")
          : nextCode(data.counterNormal, "N");

        if (isPriority) data.counterPriority = next.counter;
        else data.counterNormal = next.counter;

        const ticket = {
          id: `t-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          code: next.code,
          service,
          userEmail,
          userName,
          status: "aguardando",
          createdAt: nowIso(),
          calledAt: null,
          receivedAt: null,
          completedAt: null,
          attendedBy: null,
          notes: "",
          rating: null,
          attachments: attachments.map((file, index) => ({
            id: `a-${Date.now()}-${index}`,
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: file.dataUrl,
            uploadedAt: nowIso()
          }))
        };

        data.queue.push(ticket);
        return { ok: true, ticket: clone(ticket) };
      });
    },

    callNext(attendantName) {
      const who = String(attendantName || "Trabalhador").trim();
      return updateData((data) => {
        if (data.queue.length === 0) {
          return { ok: false, message: "Nao ha senha na fila." };
        }

        const current = data.queue.find((item) => item.id === data.currentTicketId);
        if (current && current.status === "em_atendimento") {
          return { ok: false, message: "Finalize o atendimento atual antes de chamar o proximo." };
        }

        const next = data.queue.find((item) => item.status === "aguardando" && String(item.code || "").startsWith("P"))
          || data.queue.find((item) => item.status === "aguardando");
        if (!next) return { ok: false, message: "Nao ha senha aguardando." };

        next.status = "em_atendimento";
        next.calledAt = nowIso();
        next.attendedBy = who;
        data.currentTicketId = next.id;
        data.lastCalled = { code: next.code, service: next.service, at: nowIso() };

        return { ok: true, ticket: clone(next) };
      });
    },

    concludeCurrent(attendantName, notes, serviceDurationSec) {
      const who = String(attendantName || "Trabalhador").trim();
      const note = String(notes || "").trim();
      const duration = Number(serviceDurationSec) || 0;

      return updateData((data) => {
        const ticket = data.queue.find((item) => item.id === data.currentTicketId && item.status === "em_atendimento");
        if (!ticket) {
          return { ok: false, message: "Nenhum atendimento em andamento." };
        }

        ticket.status = "concluido";
        ticket.completedAt = nowIso();
        ticket.attendedBy = who;
        if (note) ticket.notes = note;
        ticket.serviceDurationSec = duration;
        ticket.receipt = {
          fileName: `recibo_${ticket.code}.txt`,
          generatedAt: nowIso(),
          content:
`Instituto Medio Tecnico Sao Benedito
Recibo de Atendimento
Senha: ${ticket.code}
Servico: ${ticket.service}
Usuario: ${ticket.userName} (${ticket.userEmail})
Atendido por: ${who}
Hora de emissao: ${ticket.createdAt}
Hora de conclusao: ${ticket.completedAt}
Duracao de atendimento (segundos): ${duration}
Observacoes: ${ticket.notes || "Sem observacoes"}
`
        };

        data.history.unshift(ticket);
        data.queue = data.queue.filter((item) => item.id !== ticket.id);
        data.currentTicketId = null;

        return { ok: true, ticket: clone(ticket) };
      });
    },

    redirectCurrent(attendantName, notes) {
      const who = String(attendantName || "Trabalhador").trim();
      const note = String(notes || "Reencaminhado").trim();

      return updateData((data) => {
        const ticket = data.queue.find((item) => item.id === data.currentTicketId && item.status === "em_atendimento");
        if (!ticket) {
          return { ok: false, message: "Nenhum atendimento em andamento." };
        }

        ticket.status = "aguardando";
        ticket.notes = `${note} (${nowIso()})`;
        ticket.calledAt = null;
        ticket.attendedBy = who;
        data.currentTicketId = null;

        return { ok: true, ticket: clone(ticket) };
      });
    },

    setCurrentNote(note) {
      const text = String(note || "").trim();
      return updateData((data) => {
        const ticket = data.queue.find((item) => item.id === data.currentTicketId && item.status === "em_atendimento");
        if (!ticket) return { ok: false, message: "Nenhum atendimento em andamento." };
        ticket.notes = text;
        return { ok: true, ticket: clone(ticket) };
      });
    },

    markReceived(ticketId, userEmail) {
      return updateData((data) => {
        const ticket = findTicketById(data, ticketId);
        if (!ticket) return { ok: false, message: "Senha nao encontrada." };
        if (ticket.userEmail !== normalizeEmail(userEmail)) return { ok: false, message: "Senha nao pertence ao usuario logado." };

        ticket.receivedAt = nowIso();
        return { ok: true, ticket: clone(ticket) };
      });
    },

    rateTicket(ticketId, userEmail, score, comment) {
      const value = Number(score);
      const text = String(comment || "").trim();

      if (!Number.isFinite(value) || value < 1 || value > 5) {
        return { ok: false, message: "Avaliacao deve ser entre 1 e 5." };
      }

      return updateData((data) => {
        const ticket = findTicketById(data, ticketId);
        if (!ticket) return { ok: false, message: "Senha nao encontrada." };
        if (ticket.userEmail !== normalizeEmail(userEmail)) return { ok: false, message: "Senha nao pertence ao usuario logado." };
        if (ticket.status !== "concluido") return { ok: false, message: "Avaliacao disponivel apenas para atendimento concluido." };

        ticket.rating = {
          score: value,
          comment: text,
          at: nowIso()
        };

        return { ok: true, ticket: clone(ticket) };
      });
    }
  };

  window.IMTSBStore = store;
  store.ensureSeed();
})();
