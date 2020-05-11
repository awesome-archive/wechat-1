const _ = require('lodash')
const argv = require('yargs')
  .string('n')
  .number('c')
  .array('label')
  .boolean(['renumber', 'issue', 'number', 'comment'])
  .default('issue', true)
  .argv

const issues = require('../issues.json')

const issuesById = _.keyBy(issues, 'number')
const flatIssues = _.flatMap(issues, issue => _.map(issue.labels, label => _.omit({ ...issue, label }, '')))
const issuesByLabel = _.groupBy(flatIssues, 'label.name')
const issuesByGroup = _.groupBy(flatIssues, 'label.group')

function getComment (comment) {
  if (comment) {
    const commentBody = comment.body.replace(/\n#/g, '\n##')
    return commentBody
  }
}

function getIssueMd (issue) {
  const title = `## ${issue.title}`
  const body = issue.body && `<blockquote> 更多描述: ${issue.body} </blockquote>`
  const more = argv.issue ? `> 在 Issue 中交流与讨论: [Issue 地址](https://github.com/shfshanyue/Daily-Question/issues/${issue.number})` : ''
  const comment = getComment(issue.comment)
  const md = _.compact([title, body, more, comment]).join('\n\n')
  return md
}

function getIssuesMd (issues) {
  return issues
    .map((issue, i) => {
      return {
        ...issue,
        title: argv.renumber ? `${_.padStart(i + 1, 2, 0)} ${issue.title.slice(6)}` : (argv.number ? issue.title : issue.title.slice(6))
      }
    })
    .map(issue => getIssueMd(issue))
    .join('\n\n')
}

function main() {
  if (argv.n) {
    const n = String(argv.n)
    const ids = _.includes(n, '-') ? _.range(...n.split('-')) : n.split(',')
    const md = getIssuesMd(_.map(ids, id => _.get(issuesById, id)).filter(Boolean))
    console.log(md)
  }
  if (argv.label) {
    const labels = argv.label
    const count = argv.c
    const comment = count ? true : argv.comment
    const issues = _.flatMap(labels, label => issuesByLabel[label]).filter(issue => comment ? issue.comment : true)
    const filterIssues = count ? Array.from(Array(count), x => _.random(issues.length-1)).map(x => _.get(issues, x)) : issues
    const md = getIssuesMd(_.sortBy(_.uniqBy(filterIssues, 'number'), 'number'))
    console.log(md)
  }
}

main()
