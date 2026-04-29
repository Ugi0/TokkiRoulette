type TopLeadersProps = {
  title: string;
  //type: string;
  //isRecent?: boolean;
};

export default function TopLeaders({ title }: TopLeadersProps) {

    // If is recent is true you dont show interval button
    // Add function that returns Winner or Loser with input of w/l
    return (
        <section className="top-leaders">
            <div className='leaderboard-header'>
                <h1>Top Loser/Winner ${title}</h1>
                <button type={"submit"} className='interval'></button>
            </div>
            <div className="Row">
                <div className="twitch-pfp"></div>
                <div className="name"></div>
                <div className="net"></div>
            </div>
        </section>
    );

}