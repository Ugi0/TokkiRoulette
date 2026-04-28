export default function TopIndividual(title:string, type: string, isRecent: boolean = false) {

    // If is recent is true you dont show interval button
    // Add function that returns Winner or Losser with input of w/l
    return (
        <section className="top-individual">
            <div className='individual-header'>
                <h1>Top Losser/Winner ${title}</h1>
                <button type={"submit"} className='interval'></button>
            </div>
            <div className="individual">
                <div className="twitch-pfp"></div>
                <div className="name"></div>
                <div className="bet-amount"></div>
                <div className="net"></div>
            </div>
        </section>
    );
}