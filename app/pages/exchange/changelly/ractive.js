import Base from 'lib/ractive';

const Ractive = Base.extend({
  data: {
    ref: process.env.CHANGELLY_REF,
  },
});

export default Ractive;
