import React from 'react';

// Extra information, shown only to signed-in users.
export default function MoreInfo({ go }) {
  return (
    <>
      <section className="block">
        <div className="wrap">
          <h2>Three steps, then it waits for you</h2>
          <div className="cols">
            <div>
              <span className="step-no">1</span>
              <h3>Save your numbers</h3>
              <p className="muted">
                Create an account with your phone number. Our Telegram bot confirms the number is
                yours and sends you a code.
              </p>
            </div>
            <div>
              <span className="step-no">2</span>
              <h3>Add the people who matter</h3>
              <p className="muted">
                Name and number for family and close friends. Edit or delete any time.
              </p>
            </div>
            <div>
              <span className="step-no">3</span>
              <h3>Get them back anywhere</h3>
              <p className="muted">
                Open the retrieval page on any device, enter your number and password, and read your
                contacts.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2>Contact slots</h2>
          <p className="muted" style={{ marginTop: 10, maxWidth: '60ch' }}>
            Every account has 3 contact slots, free and permanent. Deleting a contact frees its slot
            so you can save a different one.
          </p>
          <div className="msg info" style={{ marginTop: 20, maxWidth: 460 }}>
            Payments are not accepted at this time.
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2>Before you rely on it</h2>
          <div className="two">
            <div>
              <h3>What to know</h3>
              <ul>
                <li>
                  Retrieval needs an internet connection and the service being available. Keep a
                  paper copy of your most critical number as well.
                </li>
                <li>
                  Signing up and resetting a password need Telegram, on the account that has your
                  registered number.
                </li>
                <li>
                  Your contact numbers are encrypted when stored. Passwords are hashed and never
                  readable.
                </li>
                <li>
                  Sessions end after 2 hours, and the retrieval page leaves nothing behind on the
                  device.
                </li>
              </ul>
            </div>
            <div>
              <h3>Saving other people’s numbers</h3>
              <ul>
                <li>
                  Only save numbers of people you have a good reason to keep, such as family and
                  close friends, and who would expect you to.
                </li>
                <li>
                  If someone finds their number here and wants it gone, they can{' '}
                  <a
                    href="#privacy"
                    onClick={(e) => {
                      e.preventDefault();
                      go('privacy');
                    }}
                  >
                    send a removal request
                  </a>
                  .
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
