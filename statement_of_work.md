# Statement Of Work

A Statement of Work (SOW) is a narrative description of the required work. It
stipulates the deliverables or services required to fulfill the contract, and it
defines the task to be accomplished or services to be delivered in clear,
concise and meaningful terms. Examples below are written for the Rynok project.

Contents:

- [Introduction](#introduction)
- [Statement of work template](#statement-of-work-template)
  - [Title](#title)
  - [Abstract](#abstract)
  - [Value](#value)
  - [Scope](#scope)
  - [Payment](#payment)
- [Purpose](#purpose)
  - [Objectives](#objectives)
  - [Performance](#performance)
- [Who does what](#who-does-what)
  - [People](#people)
  - [Roles](#roles)
  - [Responsibilities](#responsibilities)
- [Context](#context)
  - [Present](#present)
  - [Future](#future)
- [Planning](#planning)
  - [Requirements](#requirements)
- [Other terms and conditions](#other-terms-and-conditions)
  - [Client's obligations](#clients-obligations)
- [Schedule](#schedule)
  - [Expected start date and completion date](#expected-start-date-and-completion-date)
  - [Sign-off](#sign-off)


## Statement of work template


### Title

The official title of the project.

Example: Rynok - Real Estate Marketplace with Cryptocurrency Payments.


### Abstract

Summarize the work, ideally in one paragraph.

Include the most-relevant information about the project, objectives, issues,
etc.

Example: This Statement of Work (SOW) outlines the objectives, scope,
deliverables, and timelines for the development of Rynok, a web platform that
allows any registered user to publish and purchase real estate properties
using ETH through a connected Metamask wallet. The project aims to let
property owners list their houses directly, and let buyers complete secure
purchases through an escrow smart contract that protects both parties during
the transaction. The vendor will be responsible for the full lifecycle of the
project, including UX design, smart contract development, platform
implementation, testing on a testnet, and post-launch support. The timeline
for completion is estimated at 8-10 weeks, with key milestones and
deliverables identified at each phase. This SOW ensures clear expectations,
accountability, and performance standards throughout the duration of the
project.


### Value

Summarize the estimated value of the work, ideally in one paragraph.

Include the most-relevant information about costs, including costs of products,
services, materials, etc.

If you prefer to provide more information about the value, then add an appendix
section "Value".

Example: The estimated value of the work outlined in this Statement of Work
(SOW) covers the full scope of building and launching the Rynok MVP,
including platform design, front-end and back-end development, escrow smart
contract development and audit, and Metamask wallet integration. The budget
also accounts for testnet deployment, gas costs for testing, and
post-implementation support during the first weeks after mainnet launch.
Payments will be made in installments upon completion of key milestones,
ensuring alignment with project progress and deliverables. Any potential
changes or additional requirements, such as support for additional
cryptocurrencies or networks, will be assessed and billed separately, subject
to agreement by both parties.


### Scope

Summarize the range of the work, extent of the work, and parameters of the work,
ideally in one paragraph.

Include the most-relevant information about any requirements, such as people,
processes, tools, etc.

If you prefer to provide more information about the value, then add an appendix
section "Scope".

Example: The scope of this project includes the end-to-end development,
testing, and deployment of Rynok, a real estate marketplace where any
registered user can publish a property and complete a purchase using ETH via
Metamask. The work involves user registration and wallet connection, property
listing management, search and discovery, and an escrow smart contract that
holds funds until a transaction is confirmed. The project will require
collaboration between the vendor's development team and the client's product
stakeholders. Tools used will include a web front end, a back-end API, and
Solidity smart contracts deployed first to a testnet and later to the
Ethereum mainnet. The vendor will provide post-launch support to address any
issues found after the first properties are listed and purchased on the
platform.


### Payment

Summarize the payment for the work, in one paragraph.

Include the most-relevant budget requirements, payment schedule, transfer
methods, etc.

If you prefer to provide more information about the payment, then add an
appendix section "Payment".

Example: The total budget for this project will be structured across key
milestones. An initial payment will be due upon signing the contract to
initiate the project. Subsequent payments will be made upon completion of UX
and smart contract design, upon a working testnet version with wallet
connection and listings, upon completion of the escrow smart contract and
purchase flow, and a final payment upon successful testing and handover.
Payments will be made via bank transfer or, if agreed by both parties, in ETH
to a designated wallet, within an agreed number of days of invoice
submission. Any changes to the project scope or timeline, such as adding
support for stablecoins or additional networks, will be subject to additional
billing, with prior written approval from the client.


## Purpose


### Objectives

Describe the objectives of the work: what is to be achieved and delivered by the
completion of the contract.

We recommend [Objectives and Key Results
(OKRs)](http://github.com/joelparkerhenderson/objectives-and-key-results/).

Identify the most relevant goals, outcomes, and intended uses of the completed
work.

Example: The primary objective of this project is to design, develop, and
launch Rynok, a platform where any registered user can publish and purchase
real estate using ETH through Metamask. By the completion of the contract,
the following key deliverables will be achieved: a functional web platform
with property listing and search, wallet connection through Metamask, an
audited escrow smart contract for secure transactions, and a tested purchase
flow validated on a testnet before going live. The platform will be designed
to give property owners an easy way to list their homes and give buyers
confidence that their funds are protected until the transaction is complete.
The successful completion of this project will result in a working
crypto-native real estate marketplace ready for its first real users.


### Performance

Describe the performance of the work: how the work is measured, what performance
indicators are relevant, and what measurements and metrics are relevant.

We recommend [Key Performance Indicators
(KPIs)](http://github.com/joelparkerhenderson/key-performance-indicator/).

Identify the most-relevant performance measurements and metrics, for the
business aspects (e.g. net revenue, customer satisfaction) and for the technical
aspects (e.g. average daily users, percent uptime).

Example: The performance of this project will be measured through a
combination of business and technical indicators to ensure that Rynok meets
both functional requirements and organizational goals. Performance will be
monitored through regular status meetings, user feedback, and testnet
transaction reports. Adjustments and optimizations will be made as needed to
meet or exceed these agreed-upon metrics.

Example business performance metrics:

* User Adoption: A target number of properties published and wallets
  connected within the first month after launch.

* Transaction Completion Rate: A target percentage of initiated purchases
  that are successfully completed through the escrow smart contract, without
  abandonment.

Example system performance metrics:

* Uptime: The platform must maintain a high uptime target during operation to
  ensure continuous access to listings and transactions.

* Response Time: System response time should stay low for browsing and
  listing actions, excluding on-chain confirmation times which depend on the
  Ethereum network.

* Smart Contract Reliability: The escrow smart contract must pass all test
  cases on the testnet, with zero critical vulnerabilities found in the
  audit, before mainnet deployment.

* Transaction Accuracy: Funds released or refunded by the escrow smart
  contract must match the expected outcome in 100% of tested cases.


## Who does what


### People

Identify all the people who are involved a.k.a. the participants a.k.a. the
stakeholders.

Include employees, contractors, consultants, partners, vendors, customers,
auditors, investors, advisors, etc., and provide relevant contact information,
such as phone numbers, email addresses, messaging usernames, web links,
availability hours, etc.

We suggest creating a document named "people" that contains this information,
then continuously improving it.


### Roles

Identify the roles that are involved.

Include employee roles, contractor roles, consultant roles, partner roles,
vendor roles, customer roles, auditor roles, investor roles, advisor roles,
etc., and provide relevant role information, such as what the role does, its
capabilities and limits, etc.

Example roles for Rynok: property owner (publishes listings), buyer (browses
and purchases properties), smart contract auditor, and platform
administrator.

We suggest creating a document named "roles" that contains this information,
then continuously improving it.


### Responsibilities

Identify the responsibilities that are involved.

We recommend using a responsibility assignment matrix (RAM) a.k.a. linear
responsibility chart (LRC).

We suggest creating a document named "responsibilities" that contains this
information, then continuously improving it. We use a RAM called a RACIO matrix.
The matrix columns are roles. The matrix rows are areas of responsibility, such
as task groupings. The matrix cells are role-task assignments. A matrix cell
indicates the role-responsibility assignment as one of Responsible, Accountable,
Consultable, Informable, Omittable. A matrix cell may also provide any
assignment notes and details.


## Context


### Present

Identify how the work is involved with the overall organization, its objectives,
its projects, and its industry.

Describe the organization, end users, bibliography, references, technical
experts in the field, etc.

Include anything that will assist the contractor in formulating a good bid, and
the client in achieving shared understanding.

Example: Rynok enters the real estate market as a crypto-native alternative
to traditional listing platforms, targeting users who want to buy or sell
property using ETH without relying on traditional payment rails.


### Future

Describe how the work relates to the future, such as of the project,
organization, industry, etc.

Identify any relevant future roadmaps, future objectives, future work, etc.

Identify any relevant future people, such as follow-on participants, potential
upcoming stakeholders, etc.

Example: Future phases of Rynok may include support for stablecoins and
additional blockchain networks, identity and property ownership verification,
a reputation system for buyers and sellers, and legal document automation for
completed sales.


## Planning


### Requirements

Describe the tasks or activities to be performed by the contractor.

Include a detailed description of what is required for each of the identified
deliverables.

Provide sufficient information so that all parties will be able to understand
what signals completion of a phase, or milestone, or deliverable.

In most situations, this section will identify what methodology and sequence
each of the deliverables will need to meet, how the deliverable will need to be
delivered and what will be the relationship of one deliverable with another.
This section will provide information on the language, format, version and
content requirements for each task or activity and each deliverable or milestone
in the work.

It will also reference the Schedule and Estimated Level of Effort expected for
completion of the work; any Specifications or Standards which will be used; and
the Method and Source of Acceptance which will be applied by the Client to the
deliverables. This information may help to establish a progress payment
schedule.

You may see all this information included in a table and/or text.


## Other terms and conditions


### Client's obligations

Identify the access to facilities, the loan or use of Furnished Equipment, the
access to documentation, networks, etc. which Client will provide to the
Contractor. 

The following are examples of the contents that may be included under this
heading:

* Ensure availability of staff with whom the contractor may need to consult.

* Access to the Client's policies, procedures, publications, reports, studies,
  etc.

* Access to appropriate guidelines, standards, industry regulations.
  
* Provide comments on draft reports within five working days from receipt of
  report.

* Schedule events such as meetings, calls, conferences, if required.

* Provide applicable documentation.


## Schedule


### Expected start date and completion date

Identify the period in which the work is to be performed.

More details are provided in the section of the SOW which identify the specific
schedule which will be required for completion of the work.

Example language:

* The services of the Contractor will be required for a period of approximately
  (weeks, months or years), commencing on or about (day, month, year), and with
  expected completion on or about (day, month, year).

This section may also specify allowable time for work, such as number of hours
that can be billed per day, week, month, etc.


### Sign-off

The following phrase will appear at the end of each Statement of Work:

NOTE: Before signing the Statement of Work, if you have any questions or
concerns, please call the Work Authority indicated above to negotiate any
issues.

If you agree to the requirements of this Statement of Work, please sign and date
the document which will be accepted as your proposal by Client, and return to my
attention.

Please return an original signature copy by mail.


Printed Name:

__________________________________________


Signature:

__________________________________________


Date:

__________________________________________
