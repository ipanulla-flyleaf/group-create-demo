import './form-group.css'
import { students as ALL_STUDENTS, UNITS } from './students.js'

const TEACHERS = [
  'Charlotte Davis',
  'Daniel Evans',
  'Amelia Foster',
  'Marcus Hill',
  'Priya Raman',
  'Tomas Ruiz',
]

const PAGE_SIZE = 12

const state = {
  groupName: 'Maple Leaves',
  unit: UNITS[0].name,
  teachers: ['Charlotte Davis', 'Daniel Evans'],
  search: '',
  sort: { key: 'name', dir: 'asc' },
  gradeFilter: '',
  page: 1,
  memberIds: new Set(),
}

const byId = new Map(ALL_STUDENTS.map((s) => [s.id, s]))
const fullName = (s) => `${s.lastName}, ${s.firstName}`

const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  )

function availableStudents() {
  const term = state.search.trim().toLowerCase()
  let rows = ALL_STUDENTS.filter((s) => !state.memberIds.has(s.id))

  if (state.gradeFilter) rows = rows.filter((s) => s.grade === state.gradeFilter)

  if (term) {
    rows = rows.filter(
      (s) => fullName(s).toLowerCase().includes(term) || s.id.includes(term)
    )
  }

  const dir = state.sort.dir === 'asc' ? 1 : -1
  return rows.sort((a, b) => {
    if (state.sort.key === 'id') return dir * a.id.localeCompare(b.id)
    if (state.sort.key === 'grade') {
      const rank = (g) => (g === 'K' ? 0 : Number(g))
      return dir * (rank(a.grade) - rank(b.grade)) || fullName(a).localeCompare(fullName(b))
    }
    return dir * fullName(a).localeCompare(fullName(b))
  })
}

function members() {
  return [...state.memberIds]
    .map((id) => byId.get(id))
    .sort((a, b) => fullName(a).localeCompare(fullName(b)))
}

function unitPill(unit) {
  if (!unit) return ''
  return `<span class="unit"><span class="unit-dot" style="background:${unit.color}"></span>${escapeHtml(
    unit.name
  )}</span>`
}

function pageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total]
  if (current >= total - 3) return [1, '…', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}

function renderHeader() {
  const selected = new Set(state.teachers)
  return `
  <header class="app-bar">
    <div class="logo" aria-label="Flyleaf Publishing">
      <span>Flyleaf</span>
      <small>Books to Remember</small>
    </div>
  </header>

  <div class="page-head">
    <a class="back-link" href="#">&larr; Back to Washington Elementary School</a>
    <h1>Form a Group</h1>

    <div class="form-row">
      <label class="field">
        <span class="label">Group Name <em>*</em></span>
        <input id="group-name" class="input" type="text" value="${escapeHtml(state.groupName)}" />
      </label>

      <label class="field">
        <span class="label">Unit Placement <em>*</em></span>
        <div class="select-wrap">
          <span class="unit-dot" style="background:${
            UNITS.find((u) => u.name === state.unit)?.color ?? 'transparent'
          }"></span>
          <select id="unit" class="input select">
            ${UNITS.map(
              (u) =>
                `<option value="${escapeHtml(u.name)}" ${
                  u.name === state.unit ? 'selected' : ''
                }>${escapeHtml(u.name)}</option>`
            ).join('')}
          </select>
        </div>
      </label>

      <div class="field field-grow">
        <span class="label">Teacher(s)</span>
        <div class="chips-input">
          <div class="chips">
            ${state.teachers
              .map(
                (t) =>
                  `<span class="chip">${escapeHtml(
                    t
                  )}<button type="button" class="chip-x" data-remove-teacher="${escapeHtml(
                    t
                  )}" aria-label="Remove ${escapeHtml(t)}">&times;</button></span>`
              )
              .join('')}
          </div>
          <select id="add-teacher" class="chips-select" aria-label="Add teacher">
            <option value="">Add teacher…</option>
            ${TEACHERS.filter((t) => !selected.has(t))
              .map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`)
              .join('')}
          </select>
        </div>
      </div>
    </div>
  </div>`
}

function renderTable() {
  const rows = availableStudents()
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  if (state.page > totalPages) state.page = totalPages
  const start = (state.page - 1) * PAGE_SIZE
  const pageRows = rows.slice(start, start + PAGE_SIZE)

  const arrow = (key) =>
    state.sort.key === key ? (state.sort.dir === 'asc' ? '↑' : '↓') : '⇅'

  const isFiltered = Boolean(state.search.trim() || state.gradeFilter)

  return `
  <section class="card students-card">
    <div class="card-head">
      <h2>All Students</h2>
      <div class="search">
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="15" y2="15"/></svg>
        <input id="search" type="search" placeholder="Search" value="${escapeHtml(state.search)}" />
      </div>
    </div>

    <div class="table-scroll">
      <table class="students ${isFiltered ? 'has-summary' : ''}">
        <thead>
          ${
            isFiltered
              ? `<tr class="filter-summary">
            <th colspan="6">${rows.length} ${
              rows.length === 1 ? 'Student' : 'Students'
            } match your current filter</th>
          </tr>`
              : ''
          }
          <tr>
            <th class="col-add">
              <button type="button" class="bulk-btn" id="add-all" ${
                rows.length ? '' : 'disabled'
              } title="Add all ${rows.length} listed students">+ ${
                isFiltered ? rows.length : 'All'
              }</button>
            </th>
            <th><button type="button" class="th-btn" data-sort="name">Student Name <span aria-hidden="true">${arrow(
              'name'
            )}</span></button></th>
            <th><button type="button" class="th-btn" data-sort="id">Student ID <span aria-hidden="true">${arrow(
              'id'
            )}</span></button></th>
            <th>
              <div class="th-filter">
                <button type="button" class="th-btn" data-sort="grade">Grade <span aria-hidden="true">${arrow(
                  'grade'
                )}</span></button>
                <select id="grade-filter" aria-label="Filter by grade">
                  <option value="">All</option>
                  ${['K', '1', '2', '3', '4', '5']
                    .map(
                      (g) =>
                        `<option value="${g}" ${
                          state.gradeFilter === g ? 'selected' : ''
                        }>${g}</option>`
                    )
                    .join('')}
                </select>
              </div>
            </th>
            <th>Current Unit(s)</th>
            <th>Assigned Group(s)</th>
          </tr>
        </thead>
        <tbody>
          ${
            pageRows.length
              ? pageRows
                  .map(
                    (s) => `
            <tr>
              <td class="col-add">
                <button type="button" class="icon-btn add" data-add="${s.id}" aria-label="Add ${escapeHtml(
                      fullName(s)
                    )} to group">+</button>
              </td>
              <td class="name">${escapeHtml(fullName(s))}</td>
              <td>${escapeHtml(s.id)}</td>
              <td>${escapeHtml(s.grade)}</td>
              <td>${unitPill(s.unit)}</td>
              <td>${escapeHtml(s.assignedGroups.join(', '))}</td>
            </tr>`
                  )
                  .join('')
              : `<tr><td colspan="6" class="empty">No students available for selection that match your current filter.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div class="card-foot">
      <nav class="pager" aria-label="Pagination">
        <button type="button" class="page-btn" data-page="${state.page - 1}" ${
          state.page === 1 ? 'disabled' : ''
        } aria-label="Previous page">&lsaquo;</button>
        ${pageNumbers(state.page, totalPages)
          .map((p) =>
            p === '…'
              ? `<span class="page-gap">…</span>`
              : `<button type="button" class="page-btn ${
                  p === state.page ? 'current' : ''
                }" data-page="${p}">${p}</button>`
          )
          .join('')}
        <button type="button" class="page-btn" data-page="${state.page + 1}" ${
          state.page === totalPages ? 'disabled' : ''
        } aria-label="Next page">&rsaquo;</button>
      </nav>
      <span class="count">${rows.length} Students</span>
    </div>
  </section>`
}

function renderGroupPanel() {
  const list = members()
  return `
  <aside class="card group-card">
    <div class="card-head">
      <h2>Students in this Group</h2>
      <span class="badge">${list.length}</span>
      <button type="button" class="bulk-btn" id="remove-all" ${
        list.length ? '' : 'disabled'
      }>Remove All</button>
    </div>

    <ul class="group-list">
      ${
        list.length
          ? list
              .map(
                (s) => `
        <li class="group-item">
          <div>
            <div class="group-name">${escapeHtml(fullName(s))}</div>
            <div class="group-id">ID ${escapeHtml(s.id)}</div>
          </div>
          <button type="button" class="icon-btn remove" data-remove="${s.id}" aria-label="Remove ${escapeHtml(
                  fullName(s)
                )} from group">&times;</button>
        </li>`
              )
              .join('')
          : `<li class="group-empty">No students yet. Use <strong>+</strong> to add them.</li>`
      }
    </ul>

    <div class="group-actions">
      <button type="button" class="btn ghost" id="discard">DISCARD</button>
      <button type="button" class="btn primary" id="save">SAVE</button>
    </div>
  </aside>`
}

function render() {
  document.querySelector('#app').innerHTML = `
    ${renderHeader()}
    <main class="workspace">
      ${renderTable()}
      ${renderGroupPanel()}
    </main>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`
}

function toast(message) {
  const el = document.querySelector('#toast')
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toast.timer)
  toast.timer = setTimeout(() => el.classList.remove('show'), 2200)
}

const HIGHLIGHT_MS = 900
const FADE_MS = 700
const pendingAdds = new Set()

function addStudent(id, row) {
  if (pendingAdds.has(id)) return

  if (!row) {
    state.memberIds.add(id)
    render()
    return
  }

  pendingAdds.add(id)
  row.querySelector('button.add').disabled = true

  const message = document.createElement('span')
  message.className = 'row-msg'
  message.textContent = 'Student added to the group'
  row.querySelector('td.name').append(message)

  requestAnimationFrame(() => row.classList.add('adding'))
  setTimeout(() => row.classList.add('leaving'), HIGHLIGHT_MS)
  setTimeout(() => {
    pendingAdds.delete(id)
    state.memberIds.add(id)
    render()
  }, HIGHLIGHT_MS + FADE_MS)
}

const app = document.querySelector('#app')

app.addEventListener('click', (event) => {
  const target = event.target.closest('button')
  if (!target) return

  if (target.dataset.add) {
    addStudent(target.dataset.add, target.closest('tr'))
    return
  }

  if (target.dataset.remove) {
    state.memberIds.delete(target.dataset.remove)
    render()
    return
  }

  if (target.id === 'add-all') {
    const added = availableStudents()
    added.forEach((s) => state.memberIds.add(s.id))
    state.page = 1
    render()
    toast(`${added.length} student(s) added to the group.`)
    return
  }

  if (target.id === 'remove-all') {
    const removed = state.memberIds.size
    state.memberIds.clear()
    state.page = 1
    render()
    toast(`${removed} student(s) returned to the list.`)
    return
  }

  if (target.dataset.removeTeacher) {
    state.teachers = state.teachers.filter((t) => t !== target.dataset.removeTeacher)
    render()
    return
  }

  if (target.dataset.sort) {
    const key = target.dataset.sort
    state.sort =
      state.sort.key === key
        ? { key, dir: state.sort.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    state.page = 1
    render()
    return
  }

  if (target.dataset.page) {
    state.page = Number(target.dataset.page)
    render()
    return
  }

  if (target.id === 'discard') {
    state.memberIds.clear()
    state.page = 1
    render()
    toast('Group cleared.')
    return
  }

  if (target.id === 'save') {
    toast(`Saved "${state.groupName}" with ${state.memberIds.size} student(s).`)
  }
})

app.addEventListener('input', (event) => {
  if (event.target.id === 'search') {
    state.search = event.target.value
    state.page = 1
    const caret = event.target.selectionStart
    render()
    const input = document.querySelector('#search')
    input.focus()
    input.setSelectionRange(caret, caret)
    return
  }

  if (event.target.id === 'group-name') state.groupName = event.target.value
})

app.addEventListener('change', (event) => {
  if (event.target.id === 'unit') {
    state.unit = event.target.value
    render()
    return
  }

  if (event.target.id === 'grade-filter') {
    state.gradeFilter = event.target.value
    state.page = 1
    render()
    return
  }

  if (event.target.id === 'add-teacher' && event.target.value) {
    state.teachers = [...state.teachers, event.target.value]
    render()
  }
})

render()
