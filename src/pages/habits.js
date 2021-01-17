/** @jsx jsx */
import React from 'react';
import { jsx, Flex, useThemeUI } from 'theme-ui';
import { graphql } from 'gatsby';
import Helmet from 'react-helmet';
import { getDayOfYear, getYear, sub, format, isWithinInterval } from 'date-fns';
import Layout from '../components/Layout';
import ClientOnly from '../components/ClientOnly';
import StatCard from '../components/StatCard';
import Goal from '../components/Goal';
import banner from '../assets/images/banner.jpeg';

import CheckCircle from '../components/CheckCircle';
import MinusCircle from '../components/MinusCircle';

const calculate = (days) => {
  let completed = 0;
  let failed = 0;
  let trackedToday = false;
  let trackedYesterday = false;
  let trackedThisWeek = false;
  const dates = days
    .filter((day) => {
      // filter out days that weren't in this year
      const year = getYear(new Date());
      if (!day) return false;
      if (!day.date) return false;
      if (day.date === null) return false;
      return day.date.includes(String(year));
    })
    .map((day) => {
      let colorDensity = 0;
      // verify that both today and yesterday were tracked to report in the overview
      const today = new Date();
      const todayFormatted = format(today, 'yyyy-MM-dd');
      const yesterday = sub(new Date(), {
        days: 1,
      });
      const dayOneWeekAgo = sub(new Date(), {
        days: 7,
      });
      const yesterdayFormatted = format(yesterday, 'yyyy-MM-dd');
      if (day.date === todayFormatted) trackedToday = true;
      if (day.date === yesterdayFormatted) trackedYesterday = true;
      if (
        isWithinInterval(new Date(day.date), {
          start: dayOneWeekAgo,
          end: new Date(),
        })
      ) {
        trackedThisWeek = true;
      }

      if (day.status === `Done`) {
        completed += 1;
        colorDensity = 3;
      } else if (day.status.Status === `Pass`) {
        colorDensity = 2;
      } else if (day.status.Status === `Failed`) {
        failed += 1;
        colorDensity = 1;
      } else if (day.status.Status === `Not Started`) {
        colorDensity = 0;
      } else if (day.status.Status === null) {
        return {};
      }
      return { date: day.date, count: colorDensity };
    });

  return {
    dates,
    completed,
    failed,
    trackedToday,
    trackedYesterday,
    trackedThisWeek,
  };
};

function Goals({ data }) {
  const { title, url } = data.site.siteMetadata;

  const pageTitle = 'Habit Tracker';
  const description = 'Tracking goals to be better.';

  const habits = data.allHabitsJson.edges.map(({ node }) => node);

  console.log('habits', habits);

  const habitsSummaries = habits.map((habit) => {
    return {
      ...habit,
      ...calculate(habit.days),
    };
  });

  const dayOfYear = getDayOfYear(new Date());

  console.log(habitsSummaries);
  return (
    <Layout>
      <Helmet>
        <html lang="en" />
        <title>{`${pageTitle} - ${title}`}</title>
        <meta name="description" content={description} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@zeevosec" />
        <meta name="twitter:creator" content="@zeevosec" />
        <meta name="twitter:title" content={`${pageTitle} - ${title}`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={url + banner} />
      </Helmet>
      <div>
        <h1 className="page__title">{pageTitle}</h1>
        <div className="mb-7">
          <h2>Today's Overview</h2>
          <div className="">
            <div className="w-max">
              <StatCard title="Day of Year" number={dayOfYear} className="sm:p-7 p-6" />
            </div>
            <ClientOnly>
              <ul
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {habitsSummaries.map((goalSummary) => (
                  <li
                    sx={{
                      display: 'flex',
                    }}
                  >
                    {goalSummary.trackedToday ? (
                      <CheckCircle sx={{ height: '1.5rem' }} />
                    ) : (
                      <MinusCircle sx={{ height: '1.5rem' }} />
                    )}
                    {goalSummary.label} {!goalSummary.trackedToday && 'not'} reported
                  </li>
                ))}
              </ul>
            </ClientOnly>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Goals;

export const pageQuery = graphql`
  query {
    allHabitsJson {
      edges {
        node {
          key
          description
          label
          days {
            date
            status
          }
        }
      }
    }
    site {
      siteMetadata {
        url
        title
        copyright
        menu {
          label
          path
        }
        author {
          name
          twitter
          github
          rss
        }
      }
    }
  }
`;
