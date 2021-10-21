# ldpos-knex-dal
Knex Data Access Layer for LDPoS.

## Install docker
- Install [docker-engine](https://docs.docker.com/engine/install/) or [docker-desktop](https://docs.docker.com/docker-for-windows/install/)
- Make sure docker command is available on the path.

## Starting postgres
- Run ```yarn start:db``` to start postgres instance inside docker
- Type ```ctrl+c```, ```yarn stop:db```to stop & remove old db instance.

## Working with database migrations
- Create migration using ```yarn migrate:make migrration_name``` e.g. ```yarn migrate:make create_table_table_name```
- Set migration names descriptive, follow ```snake case``` for migration name and table names (column names can be kept camelCase).
- To run migration against db, run
```shell script
    yarn migrate
```
- To rollback migration
```shell script
    yarn migrate:rollback
```

## Creating seeds
- Create migration using ```yarn seed:make seed_name``` e.g. ```yarn seed:make accounts```
- follow ```snake case``` for seeds and seed name is usually table name.
- To run seeds against db, run
```shell script
    yarn seed
```
